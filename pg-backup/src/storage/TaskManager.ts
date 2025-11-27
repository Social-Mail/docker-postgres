
export class Queue<T> {

    head = 0;
    tail = 0;

    store: Map<any,any> = new Map();

    peek() {
        return this.store.get(this.head);
    }

    public enqueue(item: T) {
        this.store.set(this.tail, item);
        this.tail++;
    }

    public dequeue() {
        const { head, tail } = this;
        const size = tail - head;
        if (size <= 0) {
            return void 0;
        }            
        const item = this.store.get(head);
        this.store.delete(head);
        this.head++;
        if (this.head === this.tail) {
            this.head = 0;
            this.tail = 0;
        }
        return item;
    }

}


const sleep = (n) => new Promise((r) => setTimeout(r, n));

export default class TaskManager {

    public rateLimit = 10;

    private running: Set<any> = new Set();

    private waiting: Queue<{ resolve, reject, fx }> = new Queue();

    public queueRun<TR>(fx: (... a: any[]) => Promise<TR>): Promise<TR> {

        const pr = new Promise((resolve, reject) => {
            this.waiting.enqueue({ resolve, reject, fx });
        });

        // this is to prevent uncaught promise error.
        // eslint-disable-next-line no-console
        pr.catch((error) => console.error(error));

        this.processQueue();

        return pr as Promise<TR>;
    }

    protected processQueue() {
        for(;;) {
            if (this.running.size >= this.rateLimit) {
                return;
            }

            const t = this.waiting.dequeue();
            if (!t) {
                return;
            }

            const { fx, resolve, reject } = t;

            this.running.add(fx);

            fx().then(
                (r) => {
                    this.running.delete(fx);
                    setTimeout(() => this.processQueue(), 1);
                    resolve(r);
                },
                (e) => {
                    this.running.delete(fx);
                    setTimeout(() => this.processQueue(), 1);
                    reject(e);
                }
            );

        }
    }

    /**
     * You can queue this function that will be
     * executed after all pending fetch tasks
     * are finished
     * @param fx any function
     */
    public runAfterEnd(fx: () => any) {
        (async () => {
            for(;;) {
                await sleep(100);
                if (this.running.size > 0) {
                    continue;
                }
                await sleep(10);
                if (this.running.size > 0) {
                    continue;
                }
                break;
            }
            fx();
        })().catch(console.error);
    }

}