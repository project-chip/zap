<template>
  <q-layout view="hHh Lpr lff" class="q-electron-drag">
    <div
      class="full-width absolute-top text-h4 q-pt-md q-px-md row justify-between"
      style="height: 53.8px"
    >
      <div>
        <q-btn dense unelevated round size="5px" color="red-12" />
        <q-btn
          class="q-mx-sm"
          dense
          unelevated
          round
          size="5px"
          color="warning"
        />
        <q-btn dense unelevated round size="5px" color="green-14" />
      </div>
    </div>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<style lang="scss">
// .q-layout {
//   background-color: linear-gradient(90deg, #4e8ff2 46.12%, #76f6cf 98.55%);
//   background: url('/bg-config.png') no-repeat left top,
//     linear-gradient(90deg, #4e8ff2 46.12%, #76f6cf 98.55%);
//   // background: @image, -moz-linear-gradient(top, @startColor, @endColor); // FF 3.6+
//   //     background: @image, -webkit-gradient(linear, 0 0, 0 100%, from(@startColor), to(@endColor)); // Safari 4+, Chrome 2+
//   //     background: @image, -webkit-linear-gradient(top, @startColor, @endColor); // Safari 5.1+, Chrome 10+
//   //     background: @image, -o-linear-gradient(top, @startColor, @endColor); // Opera 11.10
//   //     background: @image, linear-gradient(to bottom, @startColor, @endColor); // Standard, IE10
//   background-attachment: fixed;
//   background-size: cover;
//   animation: fadeInAnimation ease 1.5s;
//   animation-iteration-count: 1;
//   animation-fill-mode: forwards;
// }
@keyframes fadeInAnimation {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
