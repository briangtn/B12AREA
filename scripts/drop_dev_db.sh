#!/bin/bash
echo "Please enter Mongo user"
read MONGO_USER
echo "Please enter Mongo password"
read MONGO_PASS
echo "Using $MONGO_USER with password $MONGO_PASS"
DB_POD=$(kubectl --namespace=development-area get pods | grep development-area-db | cut -d ' ' -f1 | tr '\n' ' ')
echo -ne "use area;\ndb.auth('$MONGO_USER', '$MONGO_PASS');\ndb.User.find().pretty();\ndb.User.remove({});\ndb.User.find().pretty();\n" | kubectl --namespace=development-area exec -it $DB_POD mongo