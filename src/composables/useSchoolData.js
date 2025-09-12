// composables/useSchoolData.js
import { ref } from "vue";
import { vbdbApi } from "@/services/vbdbApi";

export default function useSchoolData() {
  const schools = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchSchools = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await vbdbApi.getTeams();
      const data = response.data;
      schools.value = data.map((team) => ({
        org_id: team.team_id,
        name_official: team.name,
        school_short: team.short_name,
        division: team.division,
        conference: team.conference,
        img: team.logo,
        avca_ranking: team.avca_ranking,
      }));
    } catch (err) {
      error.value = err.message || err.response?.data?.message || "Failed to fetch schools";
      console.error("Error fetching schools:", err);
    } finally {
      loading.value = false;
    }
  };

  return {
    schools,
    loading,
    error,
    fetchSchools,
  };
}
