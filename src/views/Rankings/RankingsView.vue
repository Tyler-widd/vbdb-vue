<!-- Rankings/RankingsView.vue -->
<script setup>
import { ref, computed, watch } from "vue";
import RankingsHeader from "./RankingsHeader.vue";
import RankingsTable from "./RankingsTable.vue";
import { useScoresData } from "@/composables/useScoresData";

// Use the scores data composable
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

// Compute standings based on filters
const standings = computed(() => {
  // Filter games based on selected division and conference
  let filteredGames = scores.value;

  // Apply division filter
  if (divisionFilter.value) {
    filteredGames = filteredGames.filter(
      (score) =>
        score.team_1_division === divisionFilter.value ||
        score.team_2_division === divisionFilter.value
    );
  }

  // Apply conference filter (multi-select)
  if (conferenceFilter.value && conferenceFilter.value.length > 0) {
    filteredGames = filteredGames.filter((score) => {
      const team1Conf = formatConference(score.team_1_conference);
      const team2Conf = formatConference(score.team_2_conference);
      return (
        conferenceFilter.value.includes(team1Conf) ||
        conferenceFilter.value.includes(team2Conf)
      );
    });
  }

  // Create a map to track team statistics
  const teamStats = new Map();

  // Process each game
  filteredGames.forEach((game) => {
    // Skip games where winner hasn't been determined yet
    if (!game.winner_id) return;

    const team1Id = game.team_1_id;
    const team2Id = game.team_2_id;
    const team1Name = game.team_1_name;
    const team2Name = game.team_2_name;

    // Initialize team stats if not exists
    if (!teamStats.has(team1Id)) {
      teamStats.set(team1Id, {
        team_id: team1Id,
        team_name: team1Name,
        division: game.team_1_division || "Unknown",
        conference: formatConference(game.team_1_conference) || "Unknown",
        location: game.team_1_location || "",
        wins: 0,
        losses: 0,
        games: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }

    if (!teamStats.has(team2Id)) {
      teamStats.set(team2Id, {
        team_id: team2Id,
        team_name: team2Name,
        division: game.team_2_division || "Unknown",
        conference: formatConference(game.team_2_conference) || "Unknown",
        location: game.team_2_location || "",
        wins: 0,
        losses: 0,
        games: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }

    // Count sets won by each team
    let team1Sets = 0;
    let team2Sets = 0;

    // Check each set
    for (let i = 1; i <= 5; i++) {
      const team1Score = game[`set_${i}_team_1`];
      const team2Score = game[`set_${i}_team_2`];

      if (
        team1Score !== null &&
        team2Score !== null &&
        team1Score !== 0 &&
        team2Score !== 0
      ) {
        if (team1Score > team2Score) {
          team1Sets++;
        } else if (team2Score > team1Score) {
          team2Sets++;
        }
      }
    }

    // Update game counts and set counts
    teamStats.get(team1Id).games++;
    teamStats.get(team2Id).games++;
    teamStats.get(team1Id).setsWon += team1Sets;
    teamStats.get(team1Id).setsLost += team2Sets;
    teamStats.get(team2Id).setsWon += team2Sets;
    teamStats.get(team2Id).setsLost += team1Sets;

    // Update win/loss records based on winner_id
    if (game.winner_id === team1Id) {
      teamStats.get(team1Id).wins++;
      teamStats.get(team2Id).losses++;
    } else if (game.winner_id === team2Id) {
      teamStats.get(team2Id).wins++;
      teamStats.get(team1Id).losses++;
    }
  });

  // Convert to array and calculate win percentages
  const standingsArray = Array.from(teamStats.values()).map((team) => ({
    ...team,
    winPercentage: team.games > 0 ? team.wins / team.games : 0,
    overall_record: `${team.wins}-${team.losses}`,
    setRatio:
      team.setsLost > 0
        ? (team.setsWon / team.setsLost).toFixed(2)
        : team.setsWon.toFixed(2),
  }));

  // Sort by win percentage (descending), then by wins (descending), then by set ratio
  return standingsArray.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) {
      return b.winPercentage - a.winPercentage;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return parseFloat(b.setRatio) - parseFloat(a.setRatio);
  });
});

// Helper function to format conference names (copied from composable for local use)
const formatConference = (conference) => {
  if (!conference) return conference;

  const numericMatch = conference.toString().match(/^(\d+)(?:\.0)?$/);
  if (numericMatch) {
    return `Region ${numericMatch[1]}`;
  }

  return conference;
};

// Watch for division changes to clear conference filter
watch(divisionFilter, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    setConferenceFilter([]);
  }
});
</script>

<template>
  <div>
    <RankingsHeader
      class="mt-3"
      :divisions="divisions"
      :conferences="conferences"
      :loading="loading"
      :division-filter="divisionFilter"
      :conference-filter="conferenceFilter"
      @update:division-filter="setDivisionFilter"
      @update:conference-filter="setConferenceFilter"
    />
    <RankingsTable :standings="standings" :loading="loading" />
  </div>
</template>
