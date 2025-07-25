// router/dataLoader.js
import { useTeamsData } from "../composables/useTeamData";

export class RouterDataLoader {
  static async loadSchoolsData() {
    const { fetchSchools, schools } = useTeamsData();

    // Return early if data already loaded
    if (schools.value.length > 0) {
      return schools.value;
    }

    try {
      await fetchSchools();
      return schools.value;
    } catch (error) {
      console.error("Failed to load schools data:", error);
      throw error;
    }
  }

  static async validateSchoolExists(schoolId) {
    const schools = await this.loadSchoolsData();
    const school = schools.find((s) => s.org_id === parseInt(schoolId));

    if (!school) {
      throw new Error(`School with ID ${schoolId} not found`);
    }

    return school;
  }
}
