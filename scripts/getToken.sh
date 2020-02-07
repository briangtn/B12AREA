curl -X POST "http://localhost:8080/users/register?redirectURL=http%3A%2F%2Fbite.com" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\",\"password\":\"string\"}" 2>/dev/null  >/dev/null
curl -X POST "http://localhost:8080/users/login" -H "accept: application/json" -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\",\"password\":\"string\"}" 2>/dev/null  | jq -r '.token'

