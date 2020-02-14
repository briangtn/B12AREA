#!/bin/bash
set -e;

"${mongo[@]}" "$MONGO_INITDB_DATABASE" <<-EOJS
    use "$(_js_escape "$MONGO_INITDB_DATABASE")"
    db.createUser({
        user: $(_js_escape "$MONGO_INITDB_ROOT_USERNAME"),
        pwd: $(_js_escape "MONGO_INITDB_ROOT_PASSWORD"),
        roles: [ { role: "readWrite", db: $(_js_escape "$MONGO_INITDB_DATABASE") } ]
        })
EOJS