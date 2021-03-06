<script>
  import { onMount } from 'svelte';
  import { slide, fly } from "svelte/transition";
  import { Button } from "@graph-paper/button";
  import { Stack } from "@graph-paper/stack";
  import { Box } from "@graph-paper/box";
  import { Chip, ChipSet } from "@graph-paper/chip";
  import DimensionMenu from "../../components/controls/DimensionMenu.svelte";
  import { store } from '../../stores/store';

  import CONFIG from '../../stores/options.json';

  let selections = Object.values(CONFIG).reduce((acc, v) => {
    if (!v.inMenu) return acc;
    if (v.type === 'multi') acc[v.key] = [];
    else acc[v.key] = [v.values[0].key];
    return acc;
  }, {});

  function removeSelection(key, value) {
    return () => {
      selections[key] = [...selections[key].filter((s) => s !== value)];
      store.setField(key, selections[key]);
    };
  }

  function handleDimensionSelection(key) {
    return (event) => {
      const value = event.detail;
      selections[key] = value;
      store.setField(key, selections[key]);
    };
  }

  function setMenuWidth(key) {
    if (key === 'usage') return 72;
    if (key === 'metric') return 72;
    return 36;
  }

  function setButtonVariant(key) {
    if (key === 'usage') return 'big';
    return undefined;
  }

  let mounted = false;
  onMount(() => { mounted = true });

</script>

<style>
  h2 {
    font-size: var(--text-02);
    color: var(--cool-gray-600);
    /* font-weight: normal; */
    text-transform: uppercase;
    padding-left: var(--space-2x);
    padding-right: var(--space-2x);
    border-bottom: 1px solid var(--cool-gray-150);
    padding-bottom: var(--space-2x);
  }

  .dimension-menu--value {
    padding: 0px var(--space-2x);
  }

  .dimension-menu--value--single {
    font-size: var(--text-015);
    color: var(--cool-gray-650);
    padding-right: var(--space-8x);
    padding-left: var(--space-4x);
  }
</style>
<div class="sidebar__filters">
{#if mounted}
  <Box padding={1}>
    <div>
      <Stack space={2}>
        <!-- <h2>Aggregation Filters</h2> -->
        {#each Object.values(CONFIG).map(di => {
          // deal with menus that are not standard.
          let dim = {...di};
          const usage = CONFIG.usage.values.find(u=> u.key === $store.usage);
          if (usage.channels && di.key === 'channel') {
            dim.values = usage.channels;
          }
          return dim;
        }) as dimension, i (dimension.key)}
          {#if dimension.inMenu}
          <Stack space={0}>
            <DimensionMenu
              tooltip={dimension.description}
              on:selection={handleDimensionSelection(dimension.key)}
              selections={$store[dimension.key]}
              multi={dimension.type === 'multi'}
              menuWidth={setMenuWidth(dimension.key)}
              options={dimension.values}>
              {dimension.label}
            </DimensionMenu>
            {#if $store[dimension.key].length && dimension.type === 'multi'}
              <div transition:slide class='dimension-menu--value'>
                <ChipSet>
                  {#each $store[dimension.key] as value, i (value)}
                    <Chip
                      cancelable
                      on:cancel={removeSelection(dimension.key, value)}>
                      {value}
                    </Chip>
                  {/each}
                </ChipSet>
              </div>
            {:else if dimension.type !== 'multi'}
              <div class='dimension-menu--value dimension-menu--value--single'>
                {$store[dimension.key]}
              </div>
            {/if}
            <!-- <hr style="width:100%; border: none; border-bottom: 1px solid var(--cool-gray-150); padding:0px; margin:0px;" /> -->
          </Stack>
          {/if}
        {/each}
      </Stack>
    </div>
  </Box>
  {/if}
</div>
