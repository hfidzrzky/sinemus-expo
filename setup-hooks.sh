#!/bin/sh
git config core.hooksPath .githooks
chmod +x .githooks/pre-push
echo "[Sinemus] Git Pre-Push Hook berhasil diaktifkan!"
