clear
cd src
if tsc --outdir ../build; then
  cd ..
  dictionaryVersion="$1"
  node --localstorage-file=data/dict.sqlite \
    build/src/annotate.js ~/"Tive/data/$dictionaryVersion/Dictionary.json" \
    input/lookupConfig.json \
    input/transliterations.json \
    "output/$dictionaryVersion.txt" \
    "output/$dictionaryVersion.json" \
    "output/$dictionaryVersion-stems.json" \
    "output/$dictionaryVersion-suffix-chains.json" \
    "output/temp-stems.tsv" \
    "output/temp-suffix-chains.tsv"
  sort --output="output/$dictionaryVersion-stems.tsv" "output/temp-stems.tsv"
  sort --output="output/$dictionaryVersion-suffix-chains.tsv" "output/temp-suffix-chains.tsv"
  rm output/temp-{stems,suffix-chains}.tsv
fi
