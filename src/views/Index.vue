<template>
<div class="index">
    <NavBar class="index-nav-bar" />
    <router-view/>
</div>
    
</template>

<script setup lang="ts">
import NavBar from '@/layout/NavBar.vue';

 
</script>

<style scoped lang="less">

.index {
    .index-nav-bar {
        position: fixed;
        top:10px;
        left: 20px;
        min-width: 100vw;
    }
}
</style>