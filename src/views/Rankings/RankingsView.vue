<!-- views/Rankings/RankingsView.vue -->
<script setup>
import { computed, watch } from "vue";
import RankingsHeader from "./RankingsHeader.vue";
import RankingsTable from "./RankingsTable.vue";
import { useScoresData } from "@/composables/useScoresData";

const {
  scores,
  loading,
  divisions,
  conferences,
  divisionFilter,
  conferenceFilter,
  setDivisionFilter,
  setConferenceFilter,
} = useScoresData();

// local helpers
const formatConference = (c) => {
  if (c == null) return c;
  const s = String(c).trim();
  const m = s.match(/^(\d+)(?:\.0)?$/);
  return m ? `Region ${m[1]}` : s;
};

// ---------- FIXED STANDINGS ----------
const standings = computed(() => {
  const selected = new Set(
    (conferenceFilter.value || []).map((c) => formatConference(c))
  );

  // 1) Get all games (don't filter by division here)
  const div = divisionFilter.value;
  const games = scores.value;

  // 2) Build stats keyed by team_id
  const stats = new Map();

  const ensure = (id, name, conf, division, img) => {
    if (!stats.has(id)) {
      stats.set(id, {
        img,
        team_id: id,
        team_name: name,
        division: division || "Unknown",
        conference: formatConference(conf) || "",
        wins: 0,
        losses: 0,
        games: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }
    return stats.get(id);
  };

  const shouldInclude = (conf) =>
    selected.size === 0 || selected.has(formatConference(conf));

  for (const g of games) {
    // team meta
    const t1 = {
      id: g.team_1_id,
      name: g.team_1_name ?? g.team_1,
      conf: g.team_1_conference,
      div: g.team_1_division,
      img: g.team1Img,
    };
    const t2 = {
      id: g.team_2_id,
      name: g.team_2_name ?? g.team_2,
      conf: g.team_2_conference,
      div: g.team_2_division,
      img: g.team2Img,
    };

    // Check if teams match our division filter
    const t1MatchesDivision = !div || t1.div === div;
    const t2MatchesDivision = !div || t2.div === div;

    // Check if teams match our conference filter
    const t1MatchesConference = shouldInclude(t1.conf);
    const t2MatchesConference = shouldInclude(t2.conf);

    // Only include teams that match both division and conference filters
    const inc1 = t1MatchesDivision && t1MatchesConference;
    const inc2 = t2MatchesDivision && t2MatchesConference;

    // Skip this game if neither team should be included
    if (!inc1 && !inc2) continue;

    // count sets (from your original logic)
    let s1 = 0;
    let s2 = 0;
    for (let i = 1; i <= 5; i++) {
      const a = g[`set_${i}_team_1`];
      const b = g[`set_${i}_team_2`];
      if (a != null && b != null && a !== 0 && b !== 0) {
        if (a > b) s1++;
        else if (b > a) s2++;
      }
    }

    // increment per-team only if that team is included
    if (inc1) {
      const A = ensure(t1.id, t1.name, t1.conf, t1.div, t1.img);
      A.games++;
      A.setsWon += s1;
      A.setsLost += s2;
    }
    if (inc2) {
      const B = ensure(t2.id, t2.name, t2.conf, t2.div, t2.img);
      B.games++;
      B.setsWon += s2;
      B.setsLost += s1;
    }

    // wins / losses only for included teams
    if (g.winner_id) {
      const loserId = g.winner_id === t1.id ? t2.id : t1.id;
      if (inc1 && g.winner_id === t1.id) stats.get(t1.id).wins++;
      if (inc2 && g.winner_id === t2.id) stats.get(t2.id).wins++;
      if (inc1 && loserId === t1.id) stats.get(t1.id).losses++;
      if (inc2 && loserId === t2.id) stats.get(t2.id).losses++;
    }
  }

  // 3) finalize
  const rows = Array.from(stats.values()).map((t) => ({
    ...t,
    winPercentage: t.games ? t.wins / t.games : 0,
    overall_record: `${t.wins}-${t.losses}`,
    setRatio:
      t.setsLost > 0
        ? (t.setsWon / t.setsLost).toFixed(2)
        : t.setsWon.toFixed(2),
  }));

  // 4) sort
  rows.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage)
      return b.winPercentage - a.winPercentage;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return parseFloat(b.setRatio) - parseFloat(a.setRatio);
  });

  return rows;
});

// reset conferences when division changes
watch(divisionFilter, (n, o) => {
  if (n !== o) setConferenceFilter([]);
});
</script>

<template>
  <div>
    <RankingsHeader
      class="mt-3"
      :divisions="divisions"
      :conferences="conferences"
      :loading="loading"
      v-model:division-filter="divisionFilter"
      v-model:conference-filter="conferenceFilter"
    />
    <RankingsTable :standings="standings" :loading="loading" />
  </div>
</template>
