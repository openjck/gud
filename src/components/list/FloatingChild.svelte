<script>
  import { setContext } from "svelte";
  import { fly } from "svelte/transition";
  import { placeElement } from "@graph-paper/core/utils/float-placement";

  export let parent;
  export let element;
  export let width = 32;
  let leftPlacement = 0;
  let topPlacement = 0;
  export let verticalPad = '';
  export let location = "right";
  export let alignment = "top";
  let scrollY;
  let innerHeight

  setContext("gp:list:border-radius", "var(--space-1x)");
  setContext('gp:list:vertical-pad', verticalPad);

  let y = 0;
  $: if (parent) y = parent.getBoundingClientRect().y;
  $: if (element && parent) {
    [leftPlacement, topPlacement] = placeElement({
      location,
      alignment,
      elementPosition: element.getBoundingClientRect(),
      parentPosition: parent.getBoundingClientRect(),
      distance: 10,
      y: scrollY,
      windowHeight: innerHeight
    });
  }
</script>

<style>
  div {
    position: absolute;
    left: 0;
    top: 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.07),
      0 4px 8px rgba(0, 0, 0, 0.07), 0 8px 16px rgba(0, 0, 0, 0.07),
      0 16px 32px rgba(0, 0, 0, 0.07), 0 32px 64px rgba(0, 0, 0, 0.07);
    border-radius: var(--space-1h);
    opacity: 1;
    z-index: 10;
    transform: none;
    width: var(--width);
  }
</style>

<svelte:window bind:innerHeight />

<div
  bind:this={element}
  style="
    position: absolute; left: {leftPlacement}px; top: {topPlacement}px;
    max-height: calc(100vh - var(--space-8x));
    overflow-y: auto;
    --width: calc(var(--space-1x) * {width});
  ">
  <slot />
</div>
