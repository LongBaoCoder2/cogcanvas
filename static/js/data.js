// All numbers are copied from papers/cvpr/cvpr_main.tex.
// perN: tab:main (one fixed seed per prompt), N = 2, 3, 4, 5.
// avg:  tab:avg (weighted by prompt share 41.0/28.1/16.5/14.4 %).
// ablation: tab:ablation.
window.C2C_DATA = {
  groups: [2, 3, 4, 5],
  methods: [
    { key: "omnigen2", name: "OmniGen2", kind: "published" },
    { key: "uno", name: "UNO", kind: "published" },
    { key: "dreamo", name: "DreamO", kind: "published" },
    { key: "xverse", name: "XVerse", kind: "published" },
    { key: "mosaic", name: "MOSAIC", kind: "published" },
    { key: "onepass", name: "1-pass (FLUX.2)", kind: "control" },
    { key: "sri", name: "SRI", kind: "control" },
    { key: "ours", name: "Context2Canvas", kind: "ours" }
  ],
  perN: {
    attrvqa: {
      omnigen2: [33.04, 3.68, 5.78, 2.49],
      uno: [35.12, 14.65, 14.78, 7.27],
      dreamo: [14.45, 2.99, 4.63, 1.79],
      xverse: [7.80, 4.03, 3.17, 1.28],
      mosaic: [11.22, 5.67, 2.61, 1.92],
      onepass: [46.57, 41.40, 8.54, 3.43],
      sri: [53.41, 37.18, 35.52, 9.48],
      ours: [63.07, 56.28, 44.25, 40.27]
    },
    id: {
      omnigen2: [13.07, 0.62, 0.39, 0.08],
      uno: [23.23, 19.60, 14.37, 13.47],
      dreamo: [3.07, 0.39, 0.19, 0.03],
      xverse: [42.33, 27.21, 2.67, 0.52],
      mosaic: [9.93, 11.45, 2.46, 0.18],
      onepass: [37.56, 23.18, 10.91, 1.58],
      sri: [45.28, 32.61, 20.14, 18.31],
      ours: [50.58, 54.90, 26.80, 25.26]
    },
    dino: {
      omnigen2: [33.16, 1.74, 1.60, 0.43],
      uno: [28.03, 17.35, 13.90, 8.58],
      dreamo: [5.98, 1.20, 0.75, 0.17],
      xverse: [32.96, 15.62, 2.63, 0.46],
      mosaic: [4.77, 5.87, 1.99, 0.24],
      onepass: [33.56, 29.27, 9.64, 2.32],
      sri: [32.02, 30.14, 19.48, 16.72],
      ours: [34.02, 34.84, 29.28, 27.24]
    }
  },
  metricLabels: { attrvqa: "Attr-VQA", id: "ID-Sim", dino: "DINO-Sim" }
};

// Verification loop examples, from the seed-42 full run on the 37-case ablation set
// (HF wynhwb/context2canvas-ver3-ablation, ablation_full). Faces, matches, reports
// and prompts are copied from _logs/gen_*_seed42.log. Face boxes are in 768-px layout coords.
window.C2C_VERIFY = [{"key": "nhl", "label": "Opera House, 4 people", "group": "paper", "people": 4, "img": "static/img/verify/nhl/iter", "note": "Four people, two teddy bears. Each fix solves one error and can cause the next: an outfit lands on the wrong man, two rows invite an extra face, one row drops a person again.", "iterations": [{"iter": 1, "status": "fail", "verdict": "Person 4 not found", "count": "3 of 4 people", "action": "Prompt Refinement targets the missing person directly: it gives Person 4 an outfit and ties him to Person 3.", "faces": [[280, 477, 343, 560], [392, 424, 457, 503], [406, 515, 469, 601]], "countFail": false, "matched": ["Person 1", "Person 2", "Person 3"], "check": "Three faces, four expected. The far-right slot is empty, and Person 3 holds no teddy bear.", "segs": [["A photorealistic group photo of four friends in front of the Hanoi Opera House, Vietnam. Person 1 (far left): a young woman holding a teddy bear. Person 2 (center-left): a young man. Person 3 (center-right): a young woman holding a teddy bear. Person 4 (far right): a young man. Photorealistic.", 0]], "words": 50}, {"iter": 2, "status": "fail", "verdict": "Person 4 still not found", "count": "3 of 4 people", "action": "The outfit went to the man already in the frame, so describing Person 4 did not add him. Prompt Refinement now states the head count and splits the group into two rows.", "faces": [[280, 462, 337, 534], [399, 373, 457, 444], [469, 450, 527, 523]], "countFail": false, "matched": ["Person 1", "Person 2", "Person 3"], "check": "Still three faces. The gray polo shirt meant for Person 4 appears on Person 2 instead.", "segs": [["A photorealistic group photo of four friends in front of the Hanoi Opera House, Vietnam. Person 1 (far left): a young woman holding a teddy bear. Person 2 (center-left): a young man. Person 3 (center-right): a young woman holding a teddy bear. Person 4 (far right): a young man", 0], ["wearing a gray polo shirt, standing next to Person 3.", 1], ["Photorealistic.", 0]], "words": 60}, {"iter": 3, "status": "fail", "verdict": "5 faces for 4 people", "count": "one person too many", "action": "The two-row layout left room for an extra person in the back. Prompt Refinement drops the rows, asks for one line, and rules out anyone else.", "faces": [[240, 388, 288, 444], [252, 454, 301, 517], [360, 377, 417, 444], [481, 458, 527, 517], [484, 357, 534, 415]], "countFail": true, "matched": [], "check": "Both men now appear, but an extra woman stands in the back row. Only one teddy bear is visible.", "segs": [["A photorealistic group photo of four friends in front of the Hanoi Opera House, Vietnam. Person 1 (far left): a young woman holding a teddy bear. Person 2 (center-left): a young man. Person 3 (center-right): a young woman holding a teddy bear. Person 4 (far right): a young man wearing a gray polo shirt, standing next to Person 3.", 0], ["Exactly four people: two young women and two young men. Back row: Person 2 and Person 4. Front row: Person 1 and Person 3.", 1], ["Photorealistic.", 0]], "words": 84}, {"iter": 4, "status": "fail", "verdict": "Person 4 not found", "count": "3 of 4 people", "action": "The extra person is gone, but so is Person 4. Prompt Refinement now fixes the left-to-right order and gives each person a distinct outfit, so no slot can merge with another.", "faces": [[215, 468, 270, 540], [351, 416, 411, 490], [494, 464, 551, 536]], "countFail": false, "matched": ["Person 1", "Person 2", "Person 3"], "check": "One row and two teddy bears, as asked. The far-right man is missing again.", "segs": [["A photorealistic group photo of four friends in front of the Hanoi Opera House, Vietnam. Person 1 (far left): a young woman holding a teddy bear. Person 2 (center-left): a young man. Person 3 (center-right): a young woman holding a teddy bear. Person 4 (far right): a young man wearing a gray polo shirt, standing next to Person 3.", 0], ["Exactly four people in a single row, side by side. No other people in the frame.", 1], ["Photorealistic.", 0]], "words": 76}, {"iter": 5, "status": "pass", "verdict": "All 4 people and both teddy bears found", "count": "4 of 4 people", "action": "The layout and its masks go to Stage 2.", "faces": [[229, 405, 283, 474], [353, 364, 409, 434], [472, 424, 525, 492], [540, 364, 597, 431]], "countFail": false, "matched": ["Person 1", "Person 2", "Person 3", "Person 4"], "check": "Four faces in the stated order. Each woman holds a teddy bear.", "segs": [["A photorealistic group photo of four friends in front of the Hanoi Opera House, Vietnam. Exactly four people in a single row, side by side. No other people in the frame.", 0], ["From left to right:", 1], ["Person 1 (far left): a young woman", 0], ["in a light-blue blouse and white skirt,", 1], ["holding a teddy bear.", 0], ["Person 2 (center-left): a young man", 0], ["in a gray polo shirt and black trousers.", 1], ["Person 3 (center-right): a young woman", 0], ["in a floral dress,", 1], ["holding a teddy bear.", 0], ["Person 4 (far right): a young man", 0], ["in a gray polo shirt, at the right edge of the frame, next to Person 3.", 1], ["Photorealistic.", 0]], "words": 105}]}];
