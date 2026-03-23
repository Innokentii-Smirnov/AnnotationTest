clear
if [ -z "$1" ]; then
  echo "Please, specify a dictionary version as the first argument."
  exit
fi
if [ -z "$2" ]; then
  echo "Please, specify a path to the dictionary file as the second argument."
  exit
fi
cd src
if tsc --outdir ../build; then
  cd ..
  dictionaryVersion="$1"
  dictionaryFile="$2"
  node --localstorage-file=data/dict.sqlite \
    build/src/annotate.js "$dictionaryFile" \
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
