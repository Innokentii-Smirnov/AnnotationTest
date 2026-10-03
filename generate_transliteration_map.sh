jq --raw-input '.' input/transliterations.txt | \
jq -s --slurpfile trans output/current.json \
  'to_entries | map({(.value): $trans[0][.key]["trans"]}) | add' \
  > Transliterations.json
