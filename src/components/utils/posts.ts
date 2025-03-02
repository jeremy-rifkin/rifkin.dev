import { ref } from "vue";
import { data } from "./posts.data";

export default () => {
    return { posts: ref(data) };
};
