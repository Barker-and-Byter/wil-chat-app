import type { User, Session } from 'better-auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;

			env: {
				ROOM: DurableObjectNamespace;
				USER_LIST: DurableObjectNamespace;
			};
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}

		interface Platform {
			env: ENV;
		}
		// interface Platform {
		// 	env: {
		// 		COUNTER: DurableObjectNamespace;
		// 	};
		// 	context: {
		// 		waitUntil(promise: Promise<any>): void;
		// 	};
		// 	caches: CacheStorage & { default: Cache }
		// }
	}
}

export {};
