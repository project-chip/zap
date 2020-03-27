# What is this repo?

This repo contain all the common ZCL files, mostly defined by the ZCL specifications. 
It doesn't contain any Thread or Zigbee or Studio specific code, just the metadata.

# Want to make changes?

1. Branch off app/zcl master, zigbee master and thread master
2. Make changes in app/zcl on your branch
3. Regen apps in your zigbee branch (make af-regen) and your thread branch (make regen)
4. Run "make test" on your zigbee branch and thread branch
5. Once make test passes, open all 3 pull requests
