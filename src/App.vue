<template>
<div class="index">
    <NavBar v-if="showNavBar" />
    <div class="index-router-view">
      <router-view />
    </div>
    
</div>
    
  
</template>


<script setup lang="ts">
import NavBar from '@/layout/NavBar.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const showNavBar = computed(() => {
  const hideNavRoutes = ['/user/login', '/user/register', '/user/teacher-register'];
  return !hideNavRoutes.includes(route.path);
});
</script>
<style>


.index {
    .index-nav-bar {
        position: fixed;
        top:10px;
        left: 20px;
        min-width: 100vw;
    }
    .index-router-view {
      position: fixed;
      width: 100vw;
      height: calc(100vh - 60px);
      overflow-y: auto;
  }
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
