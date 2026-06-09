import fs from "fs";
import Papa from "papaparse";
import sql, { ConnectionPool } from "mssql";
import bcrypt from "bcrypt";
import chalk from "chalk";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const connectionDetails = {
  user: process.env.ARCADEIQ_DB_USER ?? "ArcadeIQApp",
  password: getRequiredEnv("ARCADEIQ_DB_PASSWORD"),
  server: process.env.ARCADEIQ_DB_SERVER ?? "localhost",
  database: process.env.ARCADEIQ_DB_NAME ?? "ArcadeIQ",
  options: {
    encrypt: process.env.ARCADEIQ_DB_ENCRYPT === "true",
    trustServerCertificate: process.env.ARCADEIQ_DB_TRUST_CERT !== "false",
  },
};

const userCSVPath = "../data/userdata.csv";
const gameCSVPath = "../data/gamedata.csv";
const reviewCSVPath = "../data/reviews.csv";

interface UserRow {
  Username: string;
  FirstName: string;
  LastName: string;
  FavoriteGame: string;
  MoneySpent: number;
  CreditCardNumber: number;
  Birthday: Date;
  MoneyGame: number;
  MoneyDLC: number;
  GamesOwned: number;
  Game1: string;
  Game2: string;
  Game3: string;
  Game4: string;
}

interface GameRow {
  Publishers: string[] | string | null;
  Developers: string[] | string | null;
  Name: string | null;
  Description: string | null;
  Price: string | null;
  "Release Date": Date | null;
  Tags: string[] | string | null;
}

interface ReviewRow {
  Username: string | null;
  GameName: string | null;
  Star: number | null;
  Content: string | null;
  ReviewDate: string | null;
}

let connection: sql.ConnectionPool | null = null;

process.on("SIGINT", () => {
  console.log(
    chalk.magentaBright("Termination signal received, terminating connection.")
  );
  if (connection) {
    connection.close();
  }
  process.exit();
});

const main = async () => {
  try {
    //Establish connection to server
    connection = await sql.connect(connectionDetails);
    //Parse CSV
    const userCSVRawData: string = fs.readFileSync(userCSVPath, "utf-8");
    const gameCSVRawData: string = fs.readFileSync(gameCSVPath, "utf-8");
    const reviewCSVRawData: string = fs.readFileSync(reviewCSVPath, "utf-8");

    //Handle parsed user data
    const onParseUser = async (results: Papa.ParseResult<UserRow>) => {
      console.log(chalk.bold("\nPARSING USERDATA.CSV\n"));
      const allUsers: UserRow[] = results.data;
      const defaultPassword = "Password123";
      const saltingRounds = 8;
      for (const user of allUsers) {
        try {
          //Call add user proc
          const userCall = connection?.request();
          userCall?.input("username", sql.VarChar(30), user.Username);
          userCall?.input("email", sql.VarChar(30), `${null}-${user.Username}`);
          const passwordHash = bcrypt.hashSync(defaultPassword, saltingRounds);
          userCall?.input("password", sql.VarChar(60), passwordHash);
          userCall?.input("DOB", sql.Date, user.Birthday);
          userCall?.input("Balance", 90);
          userCall?.output("NewUserID", sql.Int);
          const results = await userCall?.execute("AddUser");
          const userId: number = results?.output.NewUserID;
          console.log(
            chalk.green("Successfully created user with id " + userId)
          );

          //Register current games to user
          for (let i = 0; i < 4; i++) {
            const GameTitle = user[("Game" + (i + 1)) as keyof UserRow];
            if (GameTitle != "NULL") {
              try {
                //Get game id
                const gameIdCall = connection?.request();
                gameIdCall?.input("GameName", sql.VarChar(30), GameTitle);
                gameIdCall?.output("GameID", sql.Int);
                const idResults = await gameIdCall?.execute("GetGameID");
                const gameid: number = idResults?.output.GameID;
                if(!gameid == null) {
                  throw new sql.MSSQLError(`${GameTitle} was not found in Game table.`);
                }
                //Register game to user
                const gameToUserCall = connection?.request();
                gameToUserCall?.input("UserID", sql.Int, userId);
                gameToUserCall?.input("GameID", sql.Int, gameid);
                await gameToUserCall?.execute("RegisterGameToUser");
                console.log(
                  chalk.green(
                    `Successfully registered ${GameTitle} to ${user.Username}`
                  )
                );
              } catch (err) {
                if (err instanceof sql.MSSQLError) {
                  console.log(
                    chalk.red(
                      `Couldn't register ${GameTitle} to ${user.Username}\nMessage: ${err.message}`
                    )
                  );
                }
              }
            }
          }

          //Add favorite game
        } catch (err) {
          if (err instanceof sql.MSSQLError) {
            console.error(
              chalk.red(
                `There was an error registering this user\nMessage from server: ${err.message}`
              )
            );
          }
        }
      }
    };

    //Handle parsed game data
    const onParseGame = async (results: Papa.ParseResult<GameRow>) => {
      console.log(chalk.bold("\nPARSING GAMEDATA.CSV\n"));
      const allGames: GameRow[] = results.data;
      for (const game of allGames) {
        try {
          //Create the game instance first
          const call = connection?.request();
          call?.input("name", sql.NVarChar(200), game.Name);
          const gamePrice: number = parseFloat(
            game.Price?.replace("$", "") || ""
          );
          call?.input("price", sql.Decimal(10, 2), isNaN(gamePrice) ? "0.00" : gamePrice);
          call?.input("releasedate", sql.Date, game["Release Date"]);
          call?.input("description", sql.NText, game.Description);
          call?.output("NewGameID", sql.Int);
          const gameResult = await call?.execute("AddGame");
          //Get proper arrays of dev/publisher data
          game.Developers = (game.Developers as string).split(";");
          game.Publishers = (game.Publishers as string).split(";");
          //Register the developers and publishers
          game.Developers.forEach(async (dev: string) => {
            const devCall = connection?.request();
            devCall?.input("GameID", sql.Int, gameResult?.output.NewGameID);
            devCall?.input("DeveloperName", sql.NVarChar(100), dev);
            devCall?.output("NewDevID", sql.Int);
            await devCall?.execute("RegisterGameDeveloper");
          });
          game.Publishers.forEach(async (pub: string) => {
            const pubCall = connection?.request();
            pubCall?.input("GameID", sql.Int, gameResult?.output.NewGameID);
            pubCall?.input("ProducerName", sql.NVarChar(100), pub);
            pubCall?.output("NewProducerID", sql.Int);
            await pubCall?.execute("RegisterGameProducer");
          });
          //Register game tags
          game.Tags = (game.Tags as string).split(",");
          game.Tags.forEach(async (tag: string) => {
            const tagCall = connection?.request();
            tagCall?.input("GameID", sql.Int, gameResult?.output.NewGameID);
            tagCall?.input("TagName", sql.NVarChar(100), tag);
            await tagCall?.execute("AddTagToGame");
          })

          console.log(chalk.green(`Successfully registered game ${game.Name}`));
        } catch (err) {
          if (err instanceof sql.MSSQLError) {
            console.error(
              chalk.red(
                `There was an issue inputting this game ${game.Name}\nError message: ${err.message}`
              )
            );
          }
        }
      }
    };

    //Handle parsed review data
    const onParseReview = async (results: Papa.ParseResult<ReviewRow>) => {
      console.log(chalk.bold("\nPARSING REVIEWS.CSV\n"));
      const allReviews: ReviewRow[] = results.data;
      console.log(JSON.stringify(results.data));
      for (const review of allReviews) {
        try {
          //Get the user id and game id
          const gameIdCall = connection?.request();
          gameIdCall?.input("GameName", sql.NVarChar(200), review.GameName);
          gameIdCall?.output("GameID", sql.Int);
          const gameIdResult = await gameIdCall?.execute("GetGameID");
          const userIdCall = connection?.request();
          userIdCall?.input("Username", sql.VarChar(30), review.Username);
          userIdCall?.input("Dev", sql.Bit, false);
          userIdCall?.output("UserID", sql.Int);
          const userIdResult = await userIdCall?.execute("GetUserID");
          if(gameIdResult?.output.GameID == null || userIdResult?.output.UserID == null) {
            throw new Error('Game ID or User ID was invalid.');
          }
          //Add the new review
          const reviewCall = connection?.request();
          reviewCall?.input("UserID", sql.Int, userIdResult.output.UserID);
          reviewCall?.input("GameID", sql.Int, gameIdResult.output.GameID);
          reviewCall?.input("Star", sql.Int, review.Star);
          reviewCall?.input("Content", sql.VarChar(sql.MAX), review.Content);
          reviewCall?.input("ReviewDate", sql.Date, review.ReviewDate);
          reviewCall?.output("NewReviewID", sql.Int);
          const reviewResult = await reviewCall?.execute("AddReview");
          console.log(chalk.green(`Successfully registered review with ID ${reviewResult?.output.NewReviewID} for ${review.GameName} as user ${review.Username}`));
        } catch (err) {
          if (err instanceof sql.MSSQLError) {
            console.error(
              chalk.red(
                `There was an issue inputting this review for ${review.GameName} as user ${review.Username}\nError message: ${err.message}`
              )
            );
          } else {
            console.error(
              chalk.red(
                `A different error occurred inputting this review for ${review.GameName} as user ${review.Username}\n${err}`
              )
            );
          }
        }
      }
    };

    const waitForParses = async () => {
      // 1. Parse game CSV
      await new Promise<void>((resolve, reject) => {
        Papa.parse<GameRow>(gameCSVRawData, {
          header: true,
          complete: async (results) => {
            try {
              await onParseGame(results);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          skipEmptyLines: true,
        });
      });

      // 2. Parse user CSV (after game CSV has finished)
      await new Promise<void>((resolve, reject) => {
        Papa.parse<UserRow>(userCSVRawData, {
          header: true,
          complete: async (results) => {
            try {
              await onParseUser(results);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          skipEmptyLines: true,
        });
      });

      // 3. Parse review CSV (after user CSV has finished)
      await new Promise<void>((resolve, reject) => {
        Papa.parse<ReviewRow>(reviewCSVRawData, {
          header: true,
          complete: async (results) => {
            try {
              await onParseReview(results);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          skipEmptyLines: true,
        });
      });
    };



    //Wait on all parsing to finish to finish
    await waitForParses();

    console.log(chalk.bold("\nFINISHED PARSING ALL DATA"));
  } catch (err) {
    if (err instanceof sql.MSSQLError) {
      //Catch sql error
      console.log(chalk.red("SQL ERROR MESSAGE: " + err.message));
      return;
    }
    console.error(err);
  } finally {
    //We MUST close the connection no matter what
    if (connection) {
      connection.close();
    }
  }
};

main();
