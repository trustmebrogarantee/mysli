<template>
  <section class="wrapper">
    <aside class="sidebar-container">
      <slot name="sidebar" />
    </aside>
    <slot name="main" />
  </section>
</template>

<style lang="scss" scoped>
.wrapper {
  flex-grow: 1;
  display: flex;
  height: 100%;
  max-width: 100dvw;
  overflow: hidden;
}
.sidebar-container {
  box-sizing: border-box;
  padding: 8px 0px;
  border-right: 0.75px solid rgb(115, 115, 115);
  display: flex;
  height: 100%;
  overflow-y: auto;
  max-height: 100dvh;
  flex-direction: column;
  width: var(--sidebar-width);
  flex-grow: 0;
  flex-shrink: 0;
  @media (max-width: 900px) {
    --sidebar-width: 0px;
  }
}
</style>