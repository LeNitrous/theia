import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
    {
        path: "/",
        name: "Index",
    },
    {
        path: "/search",
        name: "Search",
        props: true,
        component: () => import("../views/search.vue")
    },
    {
        path: "/show/:id",
        name: "Show",
        props: true,
        component: () => import("../views/show.vue")
    },
    {
        path: "/watch/:term/:episode",
        name: "Watch",
        props: true,
        component: () => import("../views/watch.vue")
    }
];

const router = new VueRouter({ routes });

export default router;
