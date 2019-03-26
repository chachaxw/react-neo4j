# React Neo4j mock server

This mock server is built by [json-server](https://github.com/typicode/json-server). All the mocked data are put in file `db.json`. 


## Start mock server

Please clone or download this project to your local, and use `npm` or `yarn` to install the dependences and start server:

```
npm install
npm start
```

Or

```
yarn install
yarn start
```

Then you can access `http://localhost:3031/nodes/` to see if the server is started correctly.

## APIs

You can refer the document of [json-server](https://github.com/typicode/json-server) to see the full APIs. 

Also here are some APIs you might want to use:

### Get nodes list

```
GET http://localhost:3031/nodes
```

The response of this request would be the JSON of all nodes list.

### Get links list

```
GET http://localhost:3031/agents/{id}
```

The response of this request would be the JSON of the agent which match the id.

### Change one node

```
PUT http://localhost:3031/nodes/{id}
{
    "headers": {
        "Content-Type": "application/json"
    },
    "body": {MODIFIED NODE}
}
```

The `body` parameter is a JSON of the modified node, here is an example:

```
"body": {
      "name": “REACT NEO4J“,
      "id": 0
    }
```

Then the node which match which the id will be updated and be replaced with the modified node. 

The response of this request would be the JSON of the modified nodes

### Change one link

```
PUT http://localhost:3031/links/{id}
{
    “headers”: {
        “Content-Type”: “application/json”
    },
    “body”: {MODIFIED LINK}
}
```

The `body` parameter is a JSON of the modified link, here is an example:

```
“body”: {
      “value”: 1,
      “source”: 0,
      “target”: 9,
      “relative”: “LINK_TO”,
      “id”: 0
    }
```

Then the link which match which the id will be updated and be replaced with the modified link. 

The response of this request would be the JSON of the modified links

