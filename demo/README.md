# ArcadeIQ Local Demo

This is a database-free product demo for ArcadeIQ. It uses a small in-browser dataset to demonstrate the intended user experience before the legacy SQL Server application is fully redeployed locally.

## Run

From the repository root:

```powershell
.\scripts\start-demo.ps1
```

Open:

```text
http://localhost:4173
```

## Demo Flow

1. Run the natural-language search.
2. Select a game from the filtered results.
3. Review the generated review intelligence.
4. Review the developer copilot panel.

This demo is intentionally lightweight. The next step is to connect the same experience to a backend API and the personal SQL Server deployment.
