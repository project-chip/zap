<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">
      <slot name="title"></slot>
    </div>
    <q-card flat class="q-px-xl q-py-lg q-rounded-borders-xl">
      <slot></slot>
    </q-card>
  </q-page>
</template>
