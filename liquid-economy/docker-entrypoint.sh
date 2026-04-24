#!/bin/sh
set -e

if [ -z "$FINANCE_API_UPSTREAM" ]; then
  echo "ERROR: FINANCE_API_UPSTREAM is not set"
  exit 1
fi

if [ -z "$FINANCE_API_KEY" ]; then
  echo "ERROR: FINANCE_API_KEY is not set"
  exit 1
fi

envsubst '${FINANCE_API_UPSTREAM}${FINANCE_API_KEY}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
