#!/usr/bin/env bash
TOKEN=""
YOUTUBE_CHANNEL="UC5tfzrh0xbLk2UzycTCI7sQ"

post_curl() {
  curl -X POST "$1" -H "accept: application/json" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$2" 2>/dev/null
}

TOKEN=$(post_curl "$API_URL/users/login" "{\"email\":\"user@example.com\",\"password\":\"string\"}" | jq -r '.token')
echo "TOKEN: $TOKEN"

REDIRECT_URL=$(post_curl "$API_URL/services/login/youtube?redirectURL=https%3A%2F%2Femojipedia-us.s3.dualstack.us-west-1.amazonaws.com%2Fthumbs%2F120%2Fgoogle%2F223%2Fthumbs-up-sign_1f44d.png" | jq -r .url)
chromium "$REDIRECT_URL"
echo "Appuyer sur Entrée pour continuer..."
read tmp

AREA_ID=$(post_curl "$API_URL/areas" "{\"name\":\"AREA Test youtube service\",\"enabled\":true}" 2>/dev/null | jq -r '.id')
echo "AREA id: $AREA_ID"

post_curl "$API_URL/areas/$AREA_ID/action" "{\"serviceAction\":\"youtube.A.new_video\",\"options\":{\"channel\":\"$YOUTUBE_CHANNEL\"}}" | jq

post_curl "$API_URL/areas/$AREA_ID/reactions" "{\"serviceReaction\":\"youtube.R.like\",\"options\":{\"video\":\"{videoID}\"}}" | jq