import { page } from "fresh";
import { define } from "../utils.ts";

interface TestData {
  message: string;
}

export const handler = define.handlers({
  GET(ctx) {
    return page({ message: 'Hello World' });
  },
});

export default define.page<TestData>(function TestSimple({ data }) {
  return (
    <div>
      <h1>Test Simple</h1>
      <p>{data.message}</p>
    </div>
  );
});

