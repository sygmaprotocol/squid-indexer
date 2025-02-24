# Sygma Squid Indexer

### Running locally 

Starting the indexer:

`yarn start`

Stopping and removing containers: 

`yarn stop`

For additional commands see `package.json` or `commands.json`


# Squid Indexer API

`GET /transfers`

Fetches transfers ordered by time. Results can be filtered by various query parameters. 

#### Query Parameters
- **page**: The page number for paginated results. <br/> *Default*: `1`
- **limit**: The number of records per page.<br/> *Default*: `10`
- **status**: The status of the transfer.<br/> *Possible values*: `pending`, `executed`, `failed`
- **txHash**: Transaction hash of the transfer to filter by.
- **component**: Component of the transfer.<br/> *Possible values*: `deposit`, `execution`<br/> *Default*: `deposit`
- **sender**: The address of the sender to filter by.

`GET /domains`

Fetches all active domains. 

`GET /health`

Health check endpoint to ensure the system is running properly 
