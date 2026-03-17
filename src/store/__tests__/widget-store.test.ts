import { describe, it, expect } from "vitest";
import { getNextPosition } from "@/store/widget-store";
import type { Widget, TextBlock } from "@/store/widget-store";

function makeWidget(id: string, x: number, y: number, w: number, h: number): Widget {
  return {
    id,
    title: id,
    description: "",
    messages: [],
    layout: { x, y, w, h },
    code: null,
    files: {},
    iframeVersion: 0,
  };
}

function makeTextBlock(id: string, x: number, y: number, w: number, h: number): TextBlock {
  return {
    id,
    text: "",
    fontSize: 24,
    layout: { x, y, w, h },
  };
}

describe("getNextPosition", () => {
  it("returns origin for empty grid", () => {
    expect(getNextPosition([], [])).toEqual({ x: 0, y: 0 });
  });

  it("returns origin when no widgets match the dashboard", () => {
    const widgets = [makeWidget("w1", 0, 0, 4, 3)];
    expect(getNextPosition(widgets, ["other"])).toEqual({ x: 0, y: 0 });
  });

  it("places next widget below existing widgets", () => {
    const widgets = [makeWidget("w1", 0, 0, 4, 3)];
    expect(getNextPosition(widgets, ["w1"])).toEqual({ x: 0, y: 3 });
  });

  it("places below the bottommost widget when multiple exist", () => {
    const widgets = [
      makeWidget("w1", 0, 0, 4, 3),
      makeWidget("w2", 4, 0, 4, 3),
      makeWidget("w3", 0, 3, 4, 3),
    ];
    expect(getNextPosition(widgets, ["w1", "w2", "w3"])).toEqual({ x: 0, y: 6 });
  });

  it("places below when widgets have different heights", () => {
    const widgets = [
      makeWidget("w1", 0, 0, 4, 3),
      makeWidget("w2", 4, 0, 4, 5),
    ];
    expect(getNextPosition(widgets, ["w1", "w2"])).toEqual({ x: 0, y: 5 });
  });

  it("only considers widgets in the given dashboard", () => {
    const widgets = [
      makeWidget("w1", 0, 0, 4, 3),
      makeWidget("w2", 0, 3, 4, 3),
    ];
    expect(getNextPosition(widgets, ["w1"])).toEqual({ x: 0, y: 3 });
  });

  it("considers text blocks when calculating position", () => {
    const widgets = [makeWidget("w1", 0, 0, 4, 3)];
    const textBlocks = [makeTextBlock("t1", 0, 3, 3, 1)];
    expect(getNextPosition(widgets, ["w1"], textBlocks, ["t1"])).toEqual({ x: 0, y: 4 });
  });

  it("places below text blocks even when no widgets exist", () => {
    const textBlocks = [makeTextBlock("t1", 0, 0, 3, 1)];
    expect(getNextPosition([], [], textBlocks, ["t1"])).toEqual({ x: 0, y: 1 });
  });
});
