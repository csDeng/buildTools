<template>
<div>
    <h1>我是App.vue</h1>
    <h2>
        <span>count is {{count}}, and the double is {{double}} </span>
        <button @click='add'>+</button>
    </h2>
</div>

</template>

<script>
import {ref, computed } from 'vue';
export default{
    setup(){
        const count = ref(6)
        function add(){
            count.value++;
        }
        const double = computed(()=>count.value *=2 )
        return { count, add, double }
    }
}

</script>
