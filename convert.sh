clear
cd src
tsc --outdir ../build
cd ..
node build/src/xmlToJSON.js input/transliterations.txt input/transliterations.json
