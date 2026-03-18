clear
cd src
if tsc --outdir ../build; then
  cd ..
  dictionaryVersion="$1"
  node --localstorage-file=data/dict.sqlite \
    build/src/annotate.js ~/"Tive/data/$dictionaryVersion/Dictionary.json" \
    input/transliterations.json \
    "output/$dictionaryVersion.txt"
fi
