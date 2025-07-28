// helpers/navigateToTeam.js
export const navigateToTeam = (router, teamId, currentTeamId = null) => {
  if (teamId) {
    // Only navigate if it's a different team
    if (teamId !== currentTeamId) {
      router.push(`/teams/${teamId}`);
    }
  }
};
