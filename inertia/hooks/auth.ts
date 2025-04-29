import { usePage } from '@inertiajs/react';
import type { InertiaPage } from '~/types/inertia';

const authUser = () => usePage<InertiaPage>().props.auth;
export default authUser;
