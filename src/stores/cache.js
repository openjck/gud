import produce from "immer";
import { derived, get } from "svelte/store";
import { timeFormat } from "d3-time-format";

import options from "./options.json";
import { fetchExploreData } from "./fetchData";
import { store } from "./store";

export const removeLocalParams = (obj) => {
  const toRemove = Object.keys(obj).filter((f) => {
    return Object.keys(options)
      .filter((opt) => options[opt].onlyLocal)
      .map((opt) => options[opt].key)
      .includes(f);
  });

  return produce(obj, (draft) => {
    toRemove.forEach((r) => {
      delete draft[r];
    });
    delete draft.disabledDimensions;
  });
};

function toQueryStringParts(key, val) {
  const opt = Object.values(options).find((o) => o.key === key);
  if (!opt) return "";
  if (opt.type === "multi") {
    if (val.length === 0) return "";
    return `${opt.key}=${encodeURIComponent(JSON.stringify([...val].sort()))}`;
  }
  return `${opt.key}=${encodeURIComponent(val)}`;
}

function filterUnusedState(localState = true) {
  return ([key]) => {
    return ![
      "activeUsersYMax",
      "minStartDate",
      "maxEndDate",
      "disabledDimensions",
      "brushTransitioning",
      "disabledMetrics",
      !localState ? "startDate" : "",
      !localState ? "endDate" : "",
    ].includes(key);
  };
}

export const storeToQuery = ($store, localState = true) => {
  return Object.entries($store)
    .filter(filterUnusedState(localState))
    .map(([key, val]) => toQueryStringParts(key, val))
    .filter((q) => q !== "")
    .join("&");
};

function setRanges(data, options = { setMinStartDate: false }) {
  const $store = get(store);
  const timeFormatter = timeFormat("%Y-%m-%d");
  const earliestDateInData = timeFormatter(data[0].date);

  // with this dataset, let's set the start date if these conditions are not necessary
  if (!$store.minStartDate || $store.minStartDate !== earliestDateInData) {
    store.setField("minStartDate", earliestDateInData);
    if (options.setMinStartDate) {
      store.setField("startDate", earliestDateInData);
    }
  }

  const activeUsersYMax = Math.max(
    ...data.flatMap(({ dau_high, wau_high, mau_high }) => [
      dau_high,
      wau_high,
      mau_high,
    ])
  );

  // set the largest value seen for DAU / WAU / MAU
  if (!$store.activeUsersYMax || $store.activeUsersYMax !== activeUsersYMax) {
    store.setField("activeUsersYMax", activeUsersYMax);
  }
  return data;
}

export const datesAreDefault = derived(store, ($store) => {
  return (
    $store.startDate === $store.minStartDate &&
    $store.endDate === $store.maxEndDate
  );
});

export function createRequestCache() {
  const cacheObj = {};
  let lastMetric;
  let lastServerQuery;
  return derived(store, ($store, set) => {
    const queryParams = removeLocalParams($store);
    const q = storeToQuery(queryParams);

    const serverQuery = storeToQuery(queryParams, false);
    if (serverQuery === lastServerQuery) return;

    const newMetric = queryParams.usage;
    const metricChanged = lastMetric && lastMetric !== newMetric;
    const setMinStartDate = !$store.startDate || metricChanged;
    if ($store.mode !== "explore") return;
    if (!(q in cacheObj)) {
      cacheObj[q] = fetchExploreData(queryParams, q);
    }
    const promise = cacheObj[q].then((data) =>
      setRanges(data, { setMinStartDate })
    );
    lastMetric = newMetric;
    lastServerQuery = serverQuery;
    set(promise);
  });
}
