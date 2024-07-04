# Sygma Squid Indexer

### Running locally 

Starting docker container:

`docker-compose up`

Generating a database migration:

`sqd migration:generate`

Filling the database with data from `shared-config`:

`sqd start-init` 

Starting indexing on the desired network: 

`sqd start-<network-name>`

Checking stored data using GraphQL: 

`sqd serve`

For additional commands see `commands.json`

