# TurnipsToday

Tracks incoming posts to the /r/ACTurnips subreddit. Automatically displays and notifies subscribers in real time.

## Technologies

* React.js for the front-end client
* Express.js on Node.js for the back-end server
* WebSockets for real time client-server bi-directional communication
* RethinkDB for the database
* Web Push API for browser notifications

## Installation

To run locally, clone the repo, install `docker` and `docker-compose` (if you don't have them already) following the [official documentation](https://docs.docker.com/), and run the following in the root directory:
```
$ docker-compose up
```
Alternatively, you may run:
```
$ yarn start
```
in both the client and server directories, but you must have a [RethinkDB](https://rethinkdb.com) server running locally beforehand.
