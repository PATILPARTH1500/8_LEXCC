#!/bin/bash
cd src/assets/editorial

convert_to_webp() {
  local in_file=$1
  local out_file=$2
  local max_size=$3
  convert "$in_file" -resize "${max_size}x${max_size}>" -quality 85 "$out_file"
}

convert_to_webp "white-nike-editoriral.jpeg" "lexcc-white-nike-editorial.webp" 1000
convert_to_webp "white-chunky-sneaker.jpeg" "lexcc-white-chunky-sneaker.webp" 1000
convert_to_webp "racing-jacket-editorial.jpeg" "lexcc-racing-jacket-editorial.webp" 1600
convert_to_webp "redbull-jacket-editorial.jpeg" "lexcc-redbull-jacket-editorial.webp" 1200
convert_to_webp "puma-editorial.jpeg" "lexcc-puma-editorial.webp" 1000
convert_to_webp "nike-red-campaign.jpeg" "lexcc-nike-red-campaign.webp" 1000
convert_to_webp "newbalance-red-campaign.jpeg" "lexcc-newbalance-red-campaign.webp" 1000
convert_to_webp "jordan-red.jpeg" "lexcc-jordan-red-campaign.webp" 1000
convert_to_webp "ferrari-editorial.jpeg" "lexcc-ferrari-editorial.webp" 1600

# Remove originals
rm -f *.jpeg
