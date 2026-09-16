#!/bin/bash
export PATH="/home/param/.nvm/versions/node/v22.23.2/bin:$PATH"
exec npm --prefix "$(dirname "$0")" run dev -- --port 5173
