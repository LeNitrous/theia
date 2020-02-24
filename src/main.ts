import Vue from "vue";
import Vuex from "vuex";
import App from "./App.vue";
import Buefy from "buefy";
import vuescroll from "vuescroll";
import VueLazyLoad from "vue-lazyload";
import Component from "vue-class-component";
import router from "./router";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "./style.scss";

Component.registerHooks([
    "beforeRouteEnter",
    "beforeRouteLeave",
    "beforeRouteUpdate"
]);

library.add(fas);
Vue.component("vue-fontawesome", FontAwesomeIcon);
Vue.use(Buefy, { defaultIconComponent: "vue-fontawesome", defaultIconPack: "fas" });
Vue.use(VueLazyLoad);
Vue.use(Vuex);

Vue.use(vuescroll, { 
    ops: { 
        rail: {
            gutterOfEnds: "3rem", 
            gutterOfSide: "1rem" 
        },
        bar: {
            background: "#636363",
            opacity: 0.4
        }
    }
});

const store = new Vuex.Store({
    state: {
        episodes: { count: undefined, query: undefined },
        results: undefined,
        show: undefined,
    },
    mutations: {
        SET_SEARCH_RESULTS(state, payload) {
            state.results = payload;
        },
        SET_SELECTED_SHOW(state, payload) {
            state.show = payload;
        },
        SET_EPISODE_INFO(state, payload) {
            state.episodes = payload;
        },
    },
});

Vue.config.productionTip = false;

new Vue({
    store,
    router,
    render: h => h(App)
}).$mount("#app");
