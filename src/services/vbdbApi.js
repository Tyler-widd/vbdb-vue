import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.volleyballdatabased.com',
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY,
    'Content-Type': 'application/json'
  }
})

export const vbdbApi = {
  // Teams
  getTeams: () => apiClient.get('/teams'),
  getTeamById: (teamId) => apiClient.get(`/teams/${teamId}`),
  getTeamsByConference: (conference) => apiClient.get(`/conferences/${conference}/teams`),

  // Schedule
  getSchedule: () => apiClient.get('/schedule'),
  getScheduleByTeam: (teamId) => apiClient.get(`/schedule/${teamId}`),

  // Results/Games
  getResults: () => apiClient.get('/results'),
  getResultsByTeam: (teamId) => apiClient.get(`/results/${teamId}`),
  getGames: (params) => apiClient.get('/games', { params }),

  // Players
  getPlayers: (params) => apiClient.get('/players', { params }),
  getPlayersByTeam: (teamId) => apiClient.get(`/players/${teamId}`),

  // Other endpoints
  getSchools: () => apiClient.get('/schools'),
  getLiveGames: () => apiClient.get('/live'),
  getNews: () => apiClient.get('/news'),
  getAvcaRankings: () => apiClient.get('/avca_rankings'),
  getCccaaStandings: () => apiClient.get('/cccaa_standings'),
  getStandings: () => apiClient.get('/standings')
}