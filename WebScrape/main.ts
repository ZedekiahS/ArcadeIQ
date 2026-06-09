import { chromium } from "@playwright/test";
import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";

interface Game {
  Publishers: (string | null | undefined)[];
  Developers: (string | null | undefined)[];
  Name: string | null | undefined;
  Description: string | null | undefined;
  Price: string | null | undefined;
  ReleaseDate: string | null | undefined;
  Tags: (string | null | undefined)[];
}

const cleanString = (
  dirtyString: string | null | undefined
): string | null | undefined => {
  if (!dirtyString) {
    return dirtyString;
  }
  let newString = dirtyString.replaceAll("\t", "").replaceAll("\n", "").trim();
  if (newString.toLowerCase() === "free to play") {
    newString = "$0.00";
  }
  return newString;
};

const scrape = async () => {
  const NUM_SCROLLS_DOWN = 50; //the larger this is, the more games you will scrape
  const GAME_ANCHOR =
    "a.search_result_row.ds_collapse_flag.app_impression_tracked";
  const INITIAL_PAGE = "https://store.steampowered.com/search/?term=";

  //Initial page setup
  console.log("Launching chromium...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log(`Navigating to ${INITIAL_PAGE}`);
  await page.goto(INITIAL_PAGE);
  await page.waitForLoadState("load");

  //Scroll to get more games loaded (games are loaded dynamically on scroll)
  console.log("Games loading... (be patient)");
  await page.waitForFunction(
    (GAME_ANCHOR) => document.querySelectorAll(GAME_ANCHOR).length > 0,
    GAME_ANCHOR
  );
  let anchorCount = await page.locator(GAME_ANCHOR).count();
  for (let i = 0; i < NUM_SCROLLS_DOWN; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForFunction(
      (infoObj) =>
        document.querySelectorAll(infoObj.GAME_ANCHOR).length >
        infoObj.anchorCount,
      { anchorCount, GAME_ANCHOR }
    );
    anchorCount = await page.locator(GAME_ANCHOR).count();
  }

  console.log(`Initial count of games: ${anchorCount}`);

  //Get game anchors
  const gameAnchorHrefs = await page
    .locator(GAME_ANCHOR)
    .evaluateAll((element) => {
      return element.map((e) => e.getAttribute("href"));
    });

  //This is the Game array we will return
  let games: Game[] = [];
  //Define page elements
  const GAME_NAME = "#appHubAppName";
  const GAME_DESCRIPTION = ".game_description_snippet";
  const GAME_DEVELOPERS = "#developers_list > a";
  const GAME_PUBLISHERS = ".glance_ctn_responsive_left .dev_row"; //THIS WILL ALSO GET DEVELOPERS, FILTER LATER
  const RELEASE_DATE = ".release_date .date";
  const PRICE = ".game_area_purchase_game .game_purchase_price.price";
  const DISCOUNT_PRICE = ".game_area_purchase_game .discount_original_price";
  const TAGS = ".glance_tags.popular_tags > a";
  const ADULT_INDICATOR = ".age_gate";
  const DLC_INDICATOR = ".game_area_bubble.game_area_dlc_bubble";
  const DLC_INDICATOR_2 = ".game_area_soundtrack_bubble";

  const FORBIDDEN_HREFS = [
    "https://store.steampowered.com/app/1675200/Steam_Deck/?snr=1_7_7_230_150_2",
  ];

  //Click on each one
  for (const href of gameAnchorHrefs) {
    try {
      //Load details page
      if (!href) return;
      await page.goto(href);

      //Skip if this is an adult title
      const isAdult = await page.locator(ADULT_INDICATOR).count();
      if (isAdult) {
        console.warn(chalk.yellow(`${href} is adult. Skipping.`));
        continue;
      }

      //Skip if this is forbidden
      if (FORBIDDEN_HREFS.includes(href)) {
        console.warn(chalk.yellow(`${href} is forbidden. Skipping.`));
        continue;
      }

      //Skip if this is the steam deck or index related
      const pageTitle = await page.title();
      if (pageTitle === "Steam Deck™" || pageTitle.includes("Valve Index®")) {
        console.warn(chalk.yellow(`${href} is for Steam merch. Skipping.`));
        continue;
      }

      //Skip if this is DLC
      if (
        (await page.locator(DLC_INDICATOR).count()) +
        (await page.locator(DLC_INDICATOR_2).count())
      ) {
        console.warn(chalk.yellow(`${href} is DLC. Skipping.`));
        continue;
      }

      //Skip subscription-only games
      if (
        !(
          (await page.locator(DISCOUNT_PRICE).count()) +
          (await page.locator(PRICE).count())
        )
      ) {
        console.warn(chalk.yellow(`${href} is subscription-based. Skipping.`));
        continue;
      }

      //Scrape game data
      console.log(`Scraping ${href}`);
      const gameName = cleanString(
        await page
          .locator(GAME_NAME)
          .first()
          .evaluate((e) => e.textContent)
      );
      const gameDescription = cleanString(
        await page
          .locator(GAME_DESCRIPTION)
          .first()
          .evaluate((e) => e.textContent)
      );
      let gamePublishers: (string | null | undefined)[] = [];
      try {
        gamePublishers = await page
          .locator(GAME_PUBLISHERS)
          .nth(1) //Second row
          .evaluate(
            (e) => {
              const publishers: string[] = [];
              for (let i = 0; i < e.children.length; i++) {
                const child = e.children.item(i);
                if (!child) continue;
                if (child.classList.contains("summary")) {
                  const anchors = child.children;
                  for (let k = 0; k < anchors.length; k++) {
                    const publisher = anchors.item(k)?.textContent;
                    if (!publisher) continue;
                    publishers.push(publisher);
                  }
                }
              }
              return publishers;
            },
            { timeout: 5000 }
          )
          .then((dirtyPublishers) =>
            dirtyPublishers.map((publisher) => cleanString(publisher))
          );
      } catch {
        console.warn(
          chalk.yellow(`${href} has no publisher. Setting to empty array.`)
        );
      }
      const gameDevelopers = await page
        .locator(GAME_DEVELOPERS)
        .evaluateAll((e) => {
          const developers: string[] = [];
          e.forEach((element) => {
            const developer = element.textContent;
            if (!developer) return;
            developers.push(developer);
          });
          return developers;
        })
        .then((dirtyDevs) => dirtyDevs.map((dev) => cleanString(dev)));
      //If this is discounted, get the original price
      let gamePrice = null;
      if (await page.locator(PRICE).count()) {
        gamePrice = cleanString(
          await page
            .locator(PRICE)
            .first()
            .evaluate((e) => e.textContent)
        );
      } else {
        gamePrice = cleanString(
          await page
            .locator(DISCOUNT_PRICE)
            .first()
            .evaluate((e) => e.textContent)
        );
      }
      const gameRelease = cleanString(
        await page
          .locator(RELEASE_DATE)
          .first()
          .evaluate((e) => e.textContent)
      );
      const gameTags = await page
        .locator(TAGS)
        .evaluateAll((e) => {
          const tags: string[] = [];
          e.forEach((element) => {
            const tag = element.textContent;
            if (!tag) return;
            tags.push(tag);
          });
          return tags;
        })
        .then((dirtyTags) => dirtyTags.map((tag) => cleanString(tag)));

      games.push({
        Name: gameName,
        Description: gameDescription,
        ReleaseDate: gameRelease,
        Publishers: gamePublishers,
        Developers: gameDevelopers,
        Tags: gameTags,
        Price: gamePrice,
      });
    } catch {
      console.error(
        chalk.red("Required field missing for previous game. Skipping.")
      );
    }
  }

  console.log(
    chalk.green(
      `\nFinished scraping! Scraped ${games.length} games.\n`
    )
  );

  //Exit
  await browser.close();
  return games;
};

const main = async () => {
  //Get data by scraping steam
  const scrapedGames = await scrape();
  if (!scrapedGames) {
    console.error(chalk.red("No games were scraped. Aborting."));
    return;
  }

  //Create CSV writer
  const writer = createObjectCsvWriter({
    path: "../data/gamedata.csv",
    header: [
      { id: "name", title: "Name" },
      { id: "publishers", title: "Publishers" },
      { id: "developers", title: "Developers" },
      { id: "desc", title: "Description" },
      { id: "price", title: "Price" },
      { id: "release", title: "Release Date" },
      { id: "tags", title: "Tags" },
    ],
  });

  //Populate entries
  const records: {
    publishers: string | null;
    developers: string | null;
    name: string | null;
    desc: string | null;
    price: string | null;
    release: string | null;
    tags: string | null;
  }[] = [];
  scrapedGames.forEach((game) => {
    records.push({
      publishers: game.Publishers.join(";"),
      developers: game.Developers.join(";"),
      name: game.Name as string | null,
      desc: game.Description as string | null,
      price: game.Price as string | null,
      release: game.ReleaseDate as string | null,
      tags: game.Tags.toString(),
    });
  });

  //Write entries
  writer.writeRecords(records).then(() => {
    console.log(chalk.green("Success! Games written to CSV."));
  });
};

main();
