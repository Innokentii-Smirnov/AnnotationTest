clear
cd src
tsc --outdir ../build
cd ..
dictionaryVersion="$1"
node --localstorage-file=data/dict.sqlite \
  build/src/annotate.js ~/"Tive/data/$dictionaryVersion/Dictionary.json" \
  input/transliterations.txt \
  "output/$dictionaryVersion.txt"
