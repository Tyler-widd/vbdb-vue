<template>
  <v-sheet class="match-carousel-container d-flex align-center justify-center">
    <div class="match-carousel">
      <!-- Card 1 -->
      <v-card class="match-card h-100">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/08/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://vblimages.blob.core.windows.net/images/b44c2dbe-47c4-419c-a892-99eb952e402c.png"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">LMU</span>
            <span class="mx-2 font-weight-bold">3-2</span>
            <span class="text-caption">SDM</span>
            <v-img
              src="https://vblimages.blob.core.windows.net/images/c44df98d-c412-410e-a73a-9afd0861464a.png"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Card 2 -->
      <v-card class="match-card">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/09/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://via.placeholder.com/25/0066CC/FFFFFF?text=UCLA"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">UCLA</span>
            <span class="mx-2 font-weight-bold">3-1</span>
            <span class="text-caption">USC</span>
            <v-img
              src="https://via.placeholder.com/25/CC0000/FFFFFF?text=USC"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Card 3 -->
      <v-card class="match-card">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/10/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://via.placeholder.com/25/FFA500/FFFFFF?text=PEP"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">PEP</span>
            <span class="mx-2 font-weight-bold">3-0</span>
            <span class="text-caption">CAL</span>
            <v-img
              src="https://via.placeholder.com/25/008000/FFFFFF?text=CAL"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Card 4 -->
      <v-card class="match-card">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/11/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://via.placeholder.com/25/800080/FFFFFF?text=UCSB"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">UCSB</span>
            <span class="mx-2 font-weight-bold">2-3</span>
            <span class="text-caption">STAN</span>
            <v-img
              src="https://via.placeholder.com/25/FF1493/FFFFFF?text=STAN"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Card 5 -->
      <v-card class="match-card">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/12/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://via.placeholder.com/25/4B0082/FFFFFF?text=NW"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">NW</span>
            <span class="mx-2 font-weight-bold">3-2</span>
            <span class="text-caption">MICH</span>
            <v-img
              src="https://via.placeholder.com/25/FFFF00/000000?text=MICH"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Card 6 -->
      <v-card class="match-card">
        <v-card-subtitle
          class="text-center bg-grey-lighten-3 py-1 text-caption"
        >
          08/13/2025
        </v-card-subtitle>
        <v-card-text class="pa-2">
          <div class="d-flex align-center">
            <v-img
              src="https://via.placeholder.com/25/FF4500/FFFFFF?text=TEX"
              width="25"
              height="25"
              class="mr-1"
            />
            <span class="text-caption">TEX</span>
            <span class="mx-2 font-weight-bold">3-1</span>
            <span class="text-caption">OKLA</span>
            <v-img
              src="https://via.placeholder.com/25/8B0000/FFFFFF?text=OKLA"
              width="25"
              height="25"
              class="ml-1"
            />
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-sheet>
</template>

<style scoped>
.match-carousel-container {
  width: 100%;
  height: 64px; /* Standard nav height - adjust if needed */
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  background-color: transparent;
  position: relative;

  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
}

.match-carousel {
  display: inline-flex;
  gap: 8px;
  padding: 0 8px;
  align-items: center;
  height: 100%;
}

.match-card {
  flex: 0 0 auto;
  width: 200px;
  min-width: 200px;
  height: 56px; /* Slightly smaller than container for padding */
  display: flex;
  flex-direction: column;
  margin: 0;
}

.match-card .v-card-subtitle {
  flex: 0 0 auto;
  min-height: unset;
  padding: 2px 8px !important;
  font-size: 0.7rem !important;
}

.match-card .v-card-text {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 4px 8px !important;
}

.text-caption {
  font-size: 0.75rem !important;
  white-space: nowrap;
}

/* Optional: Add subtle shadows for depth */
.match-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.match-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.23);
  transform: translateY(-1px);
}
</style>
