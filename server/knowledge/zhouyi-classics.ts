export type ClassicalLine = {
  id: number;
  type: 0 | 1;
  name: string;
  text: string;
  image: string;
};

export type ClassicalHexagram = {
  number: number;
  name: string;
  symbol: string;
  judgment: string;
  image: string;
  lines: ClassicalLine[];
};

// Public-domain Zhouyi and Image texts, normalized as the executable KNOWLEDGE-003 corpus.
const rawHexagrams = [
  {
    "id": 1,
    "name": "乾",
    "symbol": "䷀",
    "array": [
      1,
      1,
      1,
      1,
      1,
      1
    ],
    "combination": [
      "乾",
      "乾"
    ],
    "scripture": "元亨利贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "潜龙，勿用。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "见龙在田，利见大人。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "君子终日乾乾，夕惕若，厉无咎。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "或跃在渊，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "飞龙在天，利见大人。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "亢龙有悔。"
      },
      {
        "id": 7,
        "type": 1,
        "name": "用九",
        "scripture": "见群龙无首，吉。"
      }
    ]
  },
  {
    "id": 2,
    "name": "坤",
    "symbol": "䷁",
    "array": [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "combination": [
      "坤",
      "坤"
    ],
    "scripture": "元亨，利牝马之贞。君子有攸往，先迷，后得主，利。西南得朋，东北丧朋。安贞吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "履霜，坚冰至。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "直方大，不习无不利。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "含章可贞；或从王事，无成有终。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "括囊，无咎无誉。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "黄裳，元吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "龙战于野，其血玄黄。"
      },
      {
        "id": 7,
        "type": 0,
        "name": "用六",
        "scripture": "利永贞。"
      }
    ]
  },
  {
    "id": 3,
    "name": "屯",
    "symbol": "䷂",
    "array": [
      1,
      0,
      0,
      0,
      1,
      0
    ],
    "combination": [
      "震",
      "坎"
    ],
    "scripture": "元亨，利贞；勿用有攸往，利建侯。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "磐桓；利居贞，利建侯。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "屯如，邅如，乘马班如。匪寇婚媾。女子贞不字，十年乃字。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "即鹿无虞，惟入于林中，君子几，不如舍，往吝。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "乘马班如，求婚媾，往吉，无不利。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "屯其膏，小贞吉，大贞凶。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "乘马班如，泣血涟如。"
      }
    ]
  },
  {
    "id": 4,
    "name": "蒙",
    "symbol": "䷃",
    "array": [
      0,
      1,
      0,
      0,
      0,
      1
    ],
    "combination": [
      "坎",
      "艮"
    ],
    "scripture": "亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "发蒙，利用刑人，用说桎梏；以往吝。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "包蒙，吉。纳妇，吉；子克家。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "勿用取女，见金夫，不有躬，无攸利。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "困蒙，吝。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "童蒙，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "击蒙；不利为寇，利御寇。"
      }
    ]
  },
  {
    "id": 5,
    "name": "需",
    "symbol": "䷄",
    "array": [
      1,
      1,
      1,
      0,
      1,
      0
    ],
    "combination": [
      "乾",
      "坎"
    ],
    "scripture": "有孚，光亨，贞吉，利涉大川。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "需于郊，利用恒，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "需于沙，小有言；终吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "需于泥，致寇至。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "需于血，出自穴。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "需于酒食，贞吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "入于穴，有不速之客三人来；敬之，终吉。"
      }
    ]
  },
  {
    "id": 6,
    "name": "讼",
    "symbol": "䷅",
    "array": [
      0,
      1,
      0,
      1,
      1,
      1
    ],
    "combination": [
      "坎",
      "乾"
    ],
    "scripture": "有孚，窒惕，中吉；终凶。利见大人，不利涉大川。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "不永所事，小有言，终吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "不克讼，归而逋，其邑人三百户，无眚。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "食旧德，贞厉，终吉；或从王事，无成。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "不克讼；复即命，渝，安贞，吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "讼，元吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "或锡之鞶带，终朝三褫之。"
      }
    ]
  },
  {
    "id": 7,
    "name": "师",
    "symbol": "䷆",
    "array": [
      0,
      1,
      0,
      0,
      0,
      0
    ],
    "combination": [
      "坎",
      "坤"
    ],
    "scripture": "贞，丈人吉，无咎。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "师出以律，否臧凶。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "在师中吉，无咎；王三锡命。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "师或舆尸，凶。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "师左次，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "田有禽，利执言，无咎；长子帅师，弟子舆尸，贞凶。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "大君有命，开国承家，小人勿用。"
      }
    ]
  },
  {
    "id": 8,
    "name": "比",
    "symbol": "䷇",
    "array": [
      0,
      0,
      0,
      0,
      1,
      0
    ],
    "combination": [
      "坤",
      "坎"
    ],
    "scripture": "吉。原筮，元永贞，无咎。不宁方来，后夫凶。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "有孚比之，无咎；有孚盈缶，终来有它，吉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "比之自内，贞吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "比之匪人。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "外比之，贞吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "显比；王用三驱，失前禽。邑人不诫，吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "比之无首，凶。"
      }
    ]
  },
  {
    "id": 9,
    "name": "小畜",
    "symbol": "䷈",
    "array": [
      1,
      1,
      1,
      0,
      1,
      1
    ],
    "combination": [
      "乾",
      "巽"
    ],
    "scripture": "亨。密云不雨，自我西郊。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "复自道，何其咎？吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "牵复，吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "舆说辐，夫妻反目。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "有孚，血去惕出，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "有孚挛如，富以其邻。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "既雨既处，尚德载；妇贞厉，月几望；君子征凶。"
      }
    ]
  },
  {
    "id": 10,
    "name": "履",
    "symbol": "䷉",
    "array": [
      1,
      1,
      0,
      1,
      1,
      1
    ],
    "combination": [
      "兑",
      "乾"
    ],
    "scripture": "履虎尾，不咥人，亨。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "素履，往，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "履道坦坦，幽人贞吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "眇能视，跛能履，履虎尾，咥人，凶；武人为于大君。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "履虎尾，愬愬，终吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "夬履，贞厉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "视履考祥，其旋元吉。"
      }
    ]
  },
  {
    "id": 11,
    "name": "泰",
    "symbol": "䷊",
    "array": [
      1,
      1,
      1,
      0,
      0,
      0
    ],
    "combination": [
      "乾",
      "坤"
    ],
    "scripture": "小往大来，吉，亨。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "拔茅茹，以其汇，征吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "包荒，用冯河，不遐遗；朋亡，得尚于中行。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "无平不陂，无往不复；艰贞无咎，勿恤其孚，于食有福。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "翩翩，不富，以其邻，不戒以孚。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "帝乙归妹，以祉元吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "城复于隍，勿用师，自邑告命，贞吝。"
      }
    ]
  },
  {
    "id": 12,
    "name": "否",
    "symbol": "䷋",
    "array": [
      0,
      0,
      0,
      1,
      1,
      1
    ],
    "combination": [
      "坤",
      "乾"
    ],
    "scripture": "否之匪人，不利君子贞，大往小来。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "拔茅茹，以其汇，贞吉，亨。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "包承，小人吉。大人否，亨。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "包羞。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "有命无咎，畴离祉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "休否，大人吉；其亡其亡，系于苞桑。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "倾否，先否后喜。"
      }
    ]
  },
  {
    "id": 13,
    "name": "同人",
    "symbol": "䷌",
    "array": [
      1,
      0,
      1,
      1,
      1,
      1
    ],
    "combination": [
      "离",
      "乾"
    ],
    "scripture": "同人于野，亨。利涉大川，利君子贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "同人于门，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "同人于宗，吝。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "伏戎于莽，升其高陵，三岁不兴。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "乘其墉，弗克攻，吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "同人，先号咷，而后笑，大师克相遇。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "同人于郊，无悔。"
      }
    ]
  },
  {
    "id": 14,
    "name": "大有",
    "symbol": "䷍",
    "array": [
      1,
      1,
      1,
      1,
      0,
      1
    ],
    "combination": [
      "乾",
      "离"
    ],
    "scripture": "元亨。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "无交害，匪咎；艰则无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "大车以载，有攸往，无咎。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "公用亨于天子，小人弗克。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "匪其彭，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "厥孚交如，威如，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "自天祐之，吉无不利。"
      }
    ]
  },
  {
    "id": 15,
    "name": "谦",
    "symbol": "䷎",
    "array": [
      0,
      0,
      1,
      0,
      0,
      0
    ],
    "combination": [
      "艮",
      "坤"
    ],
    "scripture": "亨，君子有终。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "谦谦君子，用涉大川，吉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "鸣谦，贞吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "劳谦，君子有终，吉。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "无不利，撝谦。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "不富以其邻，利用侵伐，无不利。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "鸣谦，利用行师，征邑国。"
      }
    ]
  },
  {
    "id": 16,
    "name": "豫",
    "symbol": "䷏",
    "array": [
      0,
      0,
      0,
      1,
      0,
      0
    ],
    "combination": [
      "坤",
      "震"
    ],
    "scripture": "利建侯，行师。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "鸣豫，凶。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "介于石，不终日，贞吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "盱豫，悔。迟有悔。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "由豫，大有得；勿疑。朋盍簪。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "贞疾，恒不死。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "冥豫，成有渝，无咎。"
      }
    ]
  },
  {
    "id": 17,
    "name": "随",
    "symbol": "䷐",
    "array": [
      1,
      0,
      0,
      1,
      1,
      0
    ],
    "combination": [
      "震",
      "兑"
    ],
    "scripture": "元亨，利贞，无咎。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "官有渝，贞吉；出门交有功。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "系小子，失丈夫。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "系丈夫，失小子；随有求得，利居贞。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "随有获，贞凶；有孚在道，以明，何咎？"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "孚于嘉，吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "拘系之，乃从维之；王用亨于西山。"
      }
    ]
  },
  {
    "id": 18,
    "name": "蛊",
    "symbol": "䷑",
    "array": [
      0,
      1,
      1,
      0,
      0,
      1
    ],
    "combination": [
      "巽",
      "艮"
    ],
    "scripture": "元亨，利涉大川。先甲三日，后甲三日。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "干父之蛊，有子，考无咎，厉终吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "干母之蛊，不可贞。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "干父之蛊，小有悔，无大咎。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "裕父之蛊，往见吝。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "干父之蛊，用誉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "不事王侯，高尚其事。"
      }
    ]
  },
  {
    "id": 19,
    "name": "临",
    "symbol": "䷒",
    "array": [
      1,
      1,
      0,
      0,
      0,
      0
    ],
    "combination": [
      "兑",
      "坤"
    ],
    "scripture": "元亨，利贞；至于八月，有凶。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "咸临，贞吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "咸临，吉，无不利。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "甘临，无攸利；既忧之，无咎。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "至临，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "知临，大君之宜，吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "敦临，吉，无咎。"
      }
    ]
  },
  {
    "id": 20,
    "name": "观",
    "symbol": "䷓",
    "array": [
      0,
      0,
      0,
      0,
      1,
      1
    ],
    "combination": [
      "坤",
      "巽"
    ],
    "scripture": "盥而不荐，有孚颙若。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "童观，小人无咎，君子吝。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "窥观，利女贞。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "观我生，进退。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "观国之光，利用宾于王。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "观我生，君子无咎。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "观其生，君子无咎。"
      }
    ]
  },
  {
    "id": 21,
    "name": "噬嗑",
    "symbol": "䷔",
    "array": [
      1,
      0,
      0,
      1,
      0,
      1
    ],
    "combination": [
      "震",
      "离"
    ],
    "scripture": "亨，利用狱。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "屦校灭趾，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "噬肤灭鼻，无咎。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "噬腊肉，遇毒；小吝，无咎。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "噬干胏，得金矢；利艰贞，吉。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "噬干肉，得黄金，贞厉，无咎。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "何校灭耳，凶。"
      }
    ]
  },
  {
    "id": 22,
    "name": "贲",
    "symbol": "䷕",
    "array": [
      1,
      0,
      1,
      0,
      0,
      1
    ],
    "combination": [
      "离",
      "艮"
    ],
    "scripture": "亨，小利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "贲其趾，舍车而徒。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "贲其须。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "贲如，濡如，永贞吉。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "贲如，皤如，白马翰如，匪寇，婚媾。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "贲于丘园，束帛戋戋；吝，终吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "白贲，无咎。"
      }
    ]
  },
  {
    "id": 23,
    "name": "剥",
    "symbol": "䷖",
    "array": [
      0,
      0,
      0,
      0,
      0,
      1
    ],
    "combination": [
      "坤",
      "艮"
    ],
    "scripture": "不利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "剥床以足，蔑贞；凶。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "剥床以辨，蔑贞凶。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "剥之，无咎。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "剥床以肤，凶。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "贯鱼以宫人宠，无不利。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "硕果不食，君子得舆，小人剥庐。"
      }
    ]
  },
  {
    "id": 24,
    "name": "复",
    "symbol": "䷗",
    "array": [
      1,
      0,
      0,
      0,
      0,
      0
    ],
    "combination": [
      "震",
      "坤"
    ],
    "scripture": "亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "不远复，无祗悔，元吉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "休复，吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "频复，厉无咎。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "中行独复。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "敦复，无悔。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "迷复，凶，有灾眚。用行师，终有大败；以其国，君凶，至于十年不克征。"
      }
    ]
  },
  {
    "id": 25,
    "name": "无妄",
    "symbol": "䷘",
    "array": [
      1,
      0,
      0,
      1,
      1,
      1
    ],
    "combination": [
      "震",
      "乾"
    ],
    "scripture": "元亨利贞。其匪正有眚，不利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "无妄，往吉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "不耕获，不菑畬，则利有攸往。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "无妄之灾：或系之牛，行人之得，邑人之灾。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "可贞，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "无妄之疾，勿药有喜。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "无妄，行有眚，无攸利。"
      }
    ]
  },
  {
    "id": 26,
    "name": "大畜",
    "symbol": "䷙",
    "array": [
      1,
      1,
      1,
      0,
      0,
      1
    ],
    "combination": [
      "乾",
      "艮"
    ],
    "scripture": "利贞，不家食，吉；利涉大川。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "有厉，利已。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "舆说輹。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "良马逐，利艰贞。曰闲舆卫，利有攸往。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "童牛之牿，元吉。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "豮豕之牙，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "何天之衢，亨。"
      }
    ]
  },
  {
    "id": 27,
    "name": "颐",
    "symbol": "䷚",
    "array": [
      1,
      0,
      0,
      0,
      0,
      1
    ],
    "combination": [
      "震",
      "艮"
    ],
    "scripture": "贞吉，观颐，自求口实。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "舍尔灵龟，观我朵颐，凶。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "颠颐；拂经于丘颐，征凶。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "拂颐；贞凶，十年勿用；无攸利。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "颠颐，吉；虎视眈眈，其欲逐逐，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "拂经；居贞吉，不可涉大川。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "由颐；厉吉，利涉大川。"
      }
    ]
  },
  {
    "id": 28,
    "name": "大过",
    "symbol": "䷛",
    "array": [
      0,
      1,
      1,
      1,
      1,
      0
    ],
    "combination": [
      "巽",
      "兑"
    ],
    "scripture": "栋桡；利有攸往，亨。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "藉用白茅，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "枯杨生稊，老夫得其女妻；无不利。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "栋桡，凶。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "栋隆，吉；有它，吝。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "枯杨生华，老妇得其士夫，无咎无誉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "过涉灭顶；凶，无咎。"
      }
    ]
  },
  {
    "id": 29,
    "name": "习坎",
    "symbol": "䷜",
    "array": [
      0,
      1,
      0,
      0,
      1,
      0
    ],
    "combination": [
      "坎",
      "坎"
    ],
    "scripture": "有孚，维心亨。行有尚。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "习坎，入于坎窞，凶。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "坎有险，求小得。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "来之坎坎，险且枕，入于坎窞，勿用。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "樽酒，簋贰，用缶，纳约自牖，终无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "坎不盈，祗既平，无咎。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "係用徽纆，寘于丛棘，三岁不得，凶。"
      }
    ]
  },
  {
    "id": 30,
    "name": "离",
    "symbol": "䷝",
    "array": [
      1,
      0,
      1,
      1,
      0,
      1
    ],
    "combination": [
      "离",
      "离"
    ],
    "scripture": "利贞，亨。畜牝牛，吉。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "履错然，敬之，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "黄离，元吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "日昃之离，不鼓缶而歌，则大耋之嗟，凶。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "突如其来如，焚如，死如，弃如。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "出涕沱若，戚嗟若，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "王用出征，有嘉折首，获匪其丑，无咎。"
      }
    ]
  },
  {
    "id": 31,
    "name": "咸",
    "symbol": "䷞",
    "array": [
      0,
      0,
      1,
      1,
      1,
      0
    ],
    "combination": [
      "艮",
      "兑"
    ],
    "scripture": "亨，利贞。取女吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "咸其拇。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "咸其腓，凶；居吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "咸其股，执其随，往吝。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "贞吉，悔亡，憧憧往来，朋从尔思。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "咸其脢，无悔。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "咸其辅颊舌。"
      }
    ]
  },
  {
    "id": 32,
    "name": "恒",
    "symbol": "䷟",
    "array": [
      0,
      1,
      1,
      1,
      0,
      0
    ],
    "combination": [
      "巽",
      "震"
    ],
    "scripture": "亨，无咎，利贞，利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "浚恒，贞凶，无攸利。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "悔亡。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "不恒其德，或承之羞；贞吝。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "田无禽。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "恒其德，贞；妇人吉，夫子凶。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "振恒，凶。"
      }
    ]
  },
  {
    "id": 33,
    "name": "遁",
    "symbol": "䷠",
    "array": [
      0,
      0,
      1,
      1,
      1,
      1
    ],
    "combination": [
      "艮",
      "乾"
    ],
    "scripture": "亨，小利贞。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "遁尾，厉，勿用有攸往。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "执之用黄牛之革，莫之胜说。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "系遁，有疾厉；畜臣妾，吉。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "好遁，君子吉，小人否。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "嘉遁，贞吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "肥遁，无不利。"
      }
    ]
  },
  {
    "id": 34,
    "name": "大壮",
    "symbol": "䷡",
    "array": [
      1,
      1,
      1,
      1,
      0,
      0
    ],
    "combination": [
      "乾",
      "震"
    ],
    "scripture": "利贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "壮于趾，征凶，有孚。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "贞吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "小人用壮，君子用罔；贞厉。羝羊触藩，羸其角。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "贞吉，悔亡；藩决不羸，壮于大舆之輹。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "丧羊于易，无悔。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "羝羊触藩，不能退，不能遂，无攸利；艰则吉。"
      }
    ]
  },
  {
    "id": 35,
    "name": "晋",
    "symbol": "䷢",
    "array": [
      0,
      0,
      0,
      1,
      0,
      1
    ],
    "combination": [
      "坤",
      "离"
    ],
    "scripture": "康侯用锡马蕃庶，昼日三接。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "晋如摧如，贞吉。罔孚，裕无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "晋如愁如，贞吉，受兹介福，于其王母。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "众允，悔亡。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "晋如鼫鼠，贞厉。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "悔亡，失得勿恤，往吉，无不利。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "晋其角，维用伐邑，厉吉无咎。贞吝。"
      }
    ]
  },
  {
    "id": 36,
    "name": "明夷",
    "symbol": "䷣",
    "array": [
      1,
      0,
      1,
      0,
      0,
      0
    ],
    "combination": [
      "离",
      "坤"
    ],
    "scripture": "利艰贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "明夷于飞，垂其翼；君子于行，三日不食。有攸往，主人有言。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "明夷，夷于左股，用拯马壮，吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "明夷于南狩，得其大首。不可疾贞。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "入于左腹，获明夷之心，于出门庭。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "箕子之明夷，利贞。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "不明晦，初登于天，后入于地。"
      }
    ]
  },
  {
    "id": 37,
    "name": "家人",
    "symbol": "䷤",
    "array": [
      1,
      0,
      1,
      0,
      1,
      1
    ],
    "combination": [
      "离",
      "巽"
    ],
    "scripture": "利女贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "闲有家，悔亡。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "无攸遂，在中馈，贞吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "家人嗃嗃，悔厉，吉；妇子嘻嘻，终吝。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "富家，大吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "王假有家，勿恤，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "有孚，威如，终吉。"
      }
    ]
  },
  {
    "id": 38,
    "name": "睽",
    "symbol": "䷥",
    "array": [
      1,
      1,
      0,
      1,
      0,
      1
    ],
    "combination": [
      "兑",
      "离"
    ],
    "scripture": "小事吉。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "悔亡；丧马勿逐，自复；见恶人，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "遇主于巷，无咎。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "见舆曳，其牛掣；其人天且劓。无初有终。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "睽孤，遇元夫，交孚，厉无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "悔亡，厥宗噬肤，往何咎？"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧；匪寇婚媾，往遇雨则吉。"
      }
    ]
  },
  {
    "id": 39,
    "name": "蹇",
    "symbol": "䷦",
    "array": [
      0,
      0,
      1,
      0,
      1,
      0
    ],
    "combination": [
      "艮",
      "坎"
    ],
    "scripture": "利西南，不利东北；利见大人，贞吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "往蹇，来誉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "王臣蹇蹇，匪躬之故。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "往蹇，来反。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "往蹇，来连。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "大蹇，朋来。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "往蹇，来硕；吉，利见大人。"
      }
    ]
  },
  {
    "id": 40,
    "name": "解",
    "symbol": "䷧",
    "array": [
      0,
      1,
      0,
      1,
      0,
      0
    ],
    "combination": [
      "坎",
      "震"
    ],
    "scripture": "利西南。无所往，其来复吉。有攸往，夙吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "田获三狐，得黄矢；贞吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "负且乘，致寇至，贞吝。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "解而拇，朋至斯孚。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "君子维有解，吉，有孚于小人。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "公用射隼于高墉之上，获之，无不利。"
      }
    ]
  },
  {
    "id": 41,
    "name": "损",
    "symbol": "䷨",
    "array": [
      1,
      1,
      0,
      0,
      0,
      1
    ],
    "combination": [
      "兑",
      "艮"
    ],
    "scripture": "有孚，元吉，无咎，可贞，利有攸往。曷之用？二簋可用享。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "已事遄往，无咎；酌损之。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "利贞，征凶；弗损益之。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "三人行，则损一人；一人行，则得其友。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "损其疾，使遄有喜，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "或益之十朋之龟，弗克违，元吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "弗损益之，无咎。贞吉，利有攸往，得臣无家。"
      }
    ]
  },
  {
    "id": 42,
    "name": "益",
    "symbol": "䷩",
    "array": [
      1,
      0,
      0,
      0,
      1,
      1
    ],
    "combination": [
      "震",
      "巽"
    ],
    "scripture": "利有攸往，利涉大川。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "利用为大作，元吉，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "或益之十朋之龟，弗克违。永贞吉；王用享于帝，吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "益之用凶事，无咎；有孚中行，告公用圭。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "中行，告公从，利用为依迁国。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "有孚惠心，勿问元吉。有孚惠我德。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "莫益之，或击之，立心勿恒，凶。"
      }
    ]
  },
  {
    "id": 43,
    "name": "夬",
    "symbol": "䷪",
    "array": [
      1,
      1,
      1,
      1,
      1,
      0
    ],
    "combination": [
      "乾",
      "兑"
    ],
    "scripture": "扬于王庭，孚号有厉；告自邑，不利即戎，利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "壮于前趾，往不胜为咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "惕号，莫夜有戎，勿恤。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "壮于頄，有凶。君子夬夬独行，遇雨若濡，有愠无咎。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "臀无肤，其行次且；牵羊悔亡，闻言不信。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "苋陆夬夬，中行无咎。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "无号，终有凶。"
      }
    ]
  },
  {
    "id": 44,
    "name": "姤",
    "symbol": "䷫",
    "array": [
      0,
      1,
      1,
      1,
      1,
      1
    ],
    "combination": [
      "巽",
      "乾"
    ],
    "scripture": "女壮，勿用取女。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "系于金柅，贞吉；有攸往，见凶，羸豕孚踯躅。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "包有鱼，无咎，不利宾。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "臀无肤，其行次且；厉，无大咎。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "包无鱼，起凶。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "以杞包瓜，含章，有陨自天。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "姤其角，吝，无咎。"
      }
    ]
  },
  {
    "id": 45,
    "name": "萃",
    "symbol": "䷬",
    "array": [
      0,
      0,
      0,
      1,
      1,
      0
    ],
    "combination": [
      "坤",
      "兑"
    ],
    "scripture": "亨，王假有庙，利见大人，亨，利贞；用大牲吉，利有攸往。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "有孚不终，乃乱乃萃；若号，一握为笑，勿恤，往无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "引吉，无咎；孚乃利用禴。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "萃如，嗟如，无攸利；往无咎，小吝。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "大吉，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "萃有位，无咎；匪孚，元永贞，悔亡。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "赍咨涕洟，无咎。"
      }
    ]
  },
  {
    "id": 46,
    "name": "升",
    "symbol": "䷭",
    "array": [
      0,
      1,
      1,
      0,
      0,
      0
    ],
    "combination": [
      "巽",
      "坤"
    ],
    "scripture": "元亨，用见大人，勿恤。南征吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "允升，大吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "孚乃利用禴，无咎。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "升虚邑。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "王用亨于岐山，吉无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "贞吉，升阶。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "冥升，利于不息之贞。"
      }
    ]
  },
  {
    "id": 47,
    "name": "困",
    "symbol": "䷮",
    "array": [
      0,
      1,
      0,
      1,
      1,
      0
    ],
    "combination": [
      "坎",
      "兑"
    ],
    "scripture": "亨。贞，大人吉，无咎；有言不信。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "臀困于株木，入于幽谷，三岁不觌。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "困于酒食，朱绂方来，利用享祀；征凶，无咎。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "困于石，据于蒺藜，入于其宫，不见其妻，凶。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "来徐徐，困于金车，吝，有终。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "劓刖，困于赤绂，乃徐有说，利用祭祀。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "困于葛藟，于臲卼，曰动悔，有悔。征吉。"
      }
    ]
  },
  {
    "id": 48,
    "name": "井",
    "symbol": "䷯",
    "array": [
      0,
      1,
      1,
      0,
      1,
      0
    ],
    "combination": [
      "巽",
      "坎"
    ],
    "scripture": "改邑不改井，无丧无得，往来井井；汔至，亦未繘井，羸其瓶，凶。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "井泥不食，旧井无禽。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "井谷射鲋，瓮敝漏。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "井渫不食，为我心恻；可用汲，王明，并受其福。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "井甃，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "井冽，寒泉食。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "井收勿幕，有孚元吉。"
      }
    ]
  },
  {
    "id": 49,
    "name": "革",
    "symbol": "䷰",
    "array": [
      1,
      0,
      1,
      1,
      1,
      0
    ],
    "combination": [
      "离",
      "兑"
    ],
    "scripture": "巳日乃孚，元亨利贞，悔亡。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "巩用黄牛之革。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "巳日乃革之，征吉，无咎。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "征凶，贞厉；革言三就，有孚。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "悔亡，有孚改命，吉。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "大人虎变，未占有孚。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "君子豹变，小人革面；征凶，居贞吉。"
      }
    ]
  },
  {
    "id": 50,
    "name": "鼎",
    "symbol": "䷱",
    "array": [
      0,
      1,
      1,
      1,
      0,
      1
    ],
    "combination": [
      "巽",
      "离"
    ],
    "scripture": "元吉，亨。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "鼎颠趾，利出否；得妾以其子，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "鼎有实，我仇有疾，不我能即，吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "鼎耳革，其行塞。雉膏不食；方雨亏悔，终吉。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "鼎折足，覆公餗，其形渥，凶。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "鼎黄耳，金铉，利贞。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "鼎玉铉，大吉，无不利。"
      }
    ]
  },
  {
    "id": 51,
    "name": "震",
    "symbol": "䷲",
    "array": [
      1,
      0,
      0,
      1,
      0,
      0
    ],
    "combination": [
      "震",
      "震"
    ],
    "scripture": "亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "震来虩虩，后笑言哑哑，吉。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "震来厉，亿丧贝，跻于九陵，勿逐，七日得。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "震苏苏，震行无眚。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "震遂泥。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "震往来，厉；亿无丧，有事。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "震索索，视矍矍，征凶。震不于其躬，于其邻，无咎。婚媾有言。"
      }
    ]
  },
  {
    "id": 52,
    "name": "艮",
    "symbol": "䷳",
    "array": [
      0,
      0,
      1,
      0,
      0,
      1
    ],
    "combination": [
      "艮",
      "艮"
    ],
    "scripture": "艮其背，不获其身；行其庭，不见其人，无咎。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "艮其趾，无咎，利永贞。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "艮其腓，不拯其随，其心不快。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "艮其限，列其夤，厉熏心。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "艮其身，无咎。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "艮其辅，言有序，悔亡。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "敦艮，吉。"
      }
    ]
  },
  {
    "id": 53,
    "name": "渐",
    "symbol": "䷴",
    "array": [
      0,
      0,
      1,
      0,
      1,
      1
    ],
    "combination": [
      "艮",
      "巽"
    ],
    "scripture": "女归吉，利贞。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "鸿渐于干；小子厉，有言，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "鸿渐于磐，饮食衎衎，吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "鸿渐于陆，夫征不复，妇孕不育，凶；利御寇。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "鸿渐于木，或得其桷，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "鸿渐于陵，妇三岁不孕；终莫之胜，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "鸿渐于陆，其羽可用为仪，吉。"
      }
    ]
  },
  {
    "id": 54,
    "name": "归妹",
    "symbol": "䷵",
    "array": [
      1,
      1,
      0,
      1,
      0,
      0
    ],
    "combination": [
      "兑",
      "震"
    ],
    "scripture": "征凶，无攸利。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "归妹以娣，跛能履，征吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "眇能视，利幽人之贞。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "归妹以须，反归以娣。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "归妹愆期，迟归有时。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "帝乙归妹，其君之袂，不如其娣之袂良；月几望，吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "女承筐，无实；士刲羊，无血。无攸利。"
      }
    ]
  },
  {
    "id": 55,
    "name": "丰",
    "symbol": "䷶",
    "array": [
      1,
      0,
      1,
      1,
      0,
      0
    ],
    "combination": [
      "离",
      "震"
    ],
    "scripture": "亨，王假之；勿忧，宜日中。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "遇其配主，虽旬无咎，往有尚。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "丰其蔀，日中见斗。往得疑疾，有孚发若，吉。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "丰其沛，日中见沬；折其右肱，无咎。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "丰其蔀，日中见斗，遇其夷主，吉。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "来章，有庆誉，吉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶。"
      }
    ]
  },
  {
    "id": 56,
    "name": "旅",
    "symbol": "䷷",
    "array": [
      0,
      0,
      1,
      1,
      0,
      1
    ],
    "combination": [
      "艮",
      "离"
    ],
    "scripture": "小亨，旅贞吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "旅琐琐，斯其所取灾。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "旅即次，怀其资，得童仆，贞。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "旅焚其次，丧其童仆，贞厉。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "旅于处，得其资斧，我心不快。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "射雉，一矢亡；终以誉命。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "鸟焚其巢，旅人先笑后号啕；丧牛于易，凶。"
      }
    ]
  },
  {
    "id": 57,
    "name": "巽",
    "symbol": "䷸",
    "array": [
      0,
      1,
      1,
      0,
      1,
      1
    ],
    "combination": [
      "巽",
      "巽"
    ],
    "scripture": "小亨，利有攸往，利见大人。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "进退，利武人之贞。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "巽在床下，用史巫纷若，吉，无咎。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "频巽，吝。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "悔亡，田获三品。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "贞吉，悔亡，无不利。无初有终。先庚三日，后庚三日，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "巽在床下，丧其资斧，贞凶。"
      }
    ]
  },
  {
    "id": 58,
    "name": "兑",
    "symbol": "䷹",
    "array": [
      1,
      1,
      0,
      1,
      1,
      0
    ],
    "combination": [
      "兑",
      "兑"
    ],
    "scripture": "亨，利贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "和兑，吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "孚兑，吉，悔亡。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "来兑，凶。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "商兑未宁，介疾有喜。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "孚于剥，有厉。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "引兑。"
      }
    ]
  },
  {
    "id": 59,
    "name": "涣",
    "symbol": "䷺",
    "array": [
      0,
      1,
      0,
      0,
      1,
      1
    ],
    "combination": [
      "坎",
      "巽"
    ],
    "scripture": "亨，王假有庙，利涉大川，利贞。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "用拯马壮，吉。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "涣奔其机，悔亡。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "涣其躬，无悔。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "涣其群，元吉；涣有丘，匪夷所思。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "涣汗其大号，涣王居，无咎。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "涣其血去逖出，无咎。"
      }
    ]
  },
  {
    "id": 60,
    "name": "节",
    "symbol": "䷻",
    "array": [
      1,
      1,
      0,
      0,
      1,
      0
    ],
    "combination": [
      "兑",
      "坎"
    ],
    "scripture": "亨，苦节，不可贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "不出户庭，无咎。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "不出门庭，凶。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "不节若，则嗟若，无咎。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "安节，亨。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "甘节，吉。往有尚。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "苦节，贞凶，悔亡。"
      }
    ]
  },
  {
    "id": 61,
    "name": "中孚",
    "symbol": "䷼",
    "array": [
      1,
      1,
      0,
      0,
      1,
      1
    ],
    "combination": [
      "兑",
      "巽"
    ],
    "scripture": "豚鱼吉，利涉大川，利贞。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "虞吉，有他不燕。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "鸣鹤在阴，其子和之；我有好爵，吾与尔靡之。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "得敌，或鼓或罢，或泣或歌。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "月几望，马匹亡，无咎。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "有孚挛如，无咎。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "翰音登于天，贞凶。"
      }
    ]
  },
  {
    "id": 62,
    "name": "小过",
    "symbol": "䷽",
    "array": [
      0,
      0,
      1,
      1,
      0,
      0
    ],
    "combination": [
      "艮",
      "震"
    ],
    "scripture": "亨，利贞；可小事，不可大事；飞鸟遗之音，不宜上，宜下，大吉。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "飞鸟以凶。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "过其祖，遇其妣；不及其君，遇其臣，无咎。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "弗过防之，从或戕之，凶。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "无咎，弗过遇之；往厉必戒，勿用永贞。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "密云不雨，自我西郊；公弋取彼在穴。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "弗遇过之；飞鸟离之，凶，是谓灾眚。"
      }
    ]
  },
  {
    "id": 63,
    "name": "既济",
    "symbol": "䷾",
    "array": [
      1,
      0,
      1,
      0,
      1,
      0
    ],
    "combination": [
      "离",
      "坎"
    ],
    "scripture": "亨小，利贞。初吉终乱。",
    "lines": [
      {
        "id": 1,
        "type": 1,
        "name": "初九",
        "scripture": "曳其轮，濡其尾，无咎。"
      },
      {
        "id": 2,
        "type": 0,
        "name": "六二",
        "scripture": "妇丧其茀，勿逐，七日得。"
      },
      {
        "id": 3,
        "type": 1,
        "name": "九三",
        "scripture": "高宗伐鬼方，三年克之；小人勿用。"
      },
      {
        "id": 4,
        "type": 0,
        "name": "六四",
        "scripture": "繻有衣袽，终日戒。"
      },
      {
        "id": 5,
        "type": 1,
        "name": "九五",
        "scripture": "东邻杀牛，不如西邻之禴祭，实受其福。"
      },
      {
        "id": 6,
        "type": 0,
        "name": "上六",
        "scripture": "濡其首，厉。"
      }
    ]
  },
  {
    "id": 64,
    "name": "未济",
    "symbol": "䷿",
    "array": [
      0,
      1,
      0,
      1,
      0,
      1
    ],
    "combination": [
      "坎",
      "离"
    ],
    "scripture": "亨，小狐汔济，濡其尾，无攸利。",
    "lines": [
      {
        "id": 1,
        "type": 0,
        "name": "初六",
        "scripture": "濡其尾，吝。"
      },
      {
        "id": 2,
        "type": 1,
        "name": "九二",
        "scripture": "曳其轮，贞吉。"
      },
      {
        "id": 3,
        "type": 0,
        "name": "六三",
        "scripture": "未济，征凶，利涉大川。"
      },
      {
        "id": 4,
        "type": 1,
        "name": "九四",
        "scripture": "贞吉，悔亡；震用伐鬼方，三年有赏于大国。"
      },
      {
        "id": 5,
        "type": 0,
        "name": "六五",
        "scripture": "贞吉，无悔；君子之光，有孚，吉。"
      },
      {
        "id": 6,
        "type": 1,
        "name": "上九",
        "scripture": "有孚于饮酒；无咎，濡其首，有孚失是。"
      }
    ]
  }
] as const;
const imageTexts: Record<string, string> = {
  "iching__1": "天行健，君子以自强不息。",
  "iching__1_1": "“潜龙，勿用”，阳在下也。",
  "iching__1_2": "“见龙再田”，德施普也。",
  "iching__1_3": "“终日乾乾”，反复道也。",
  "iching__1_4": "“或跃在渊”，进无咎也。",
  "iching__1_5": "“飞龙在天”，“大人”造也。",
  "iching__1_6": "“亢龙有悔”，盈不可久也。",
  "iching__1_7": "“用九”，天德不可为首也。",
  "iching__2": "地势坤，君子以厚德载物。",
  "iching__2_1": "“履霜坚冰”，阴始凝也；驯致其道，至坚冰也。",
  "iching__2_2": "六二之动，“直”以“方”也。“不习无不利”，地道光也。",
  "iching__2_3": "“含章可贞”，以时发也；“或从王事”，知光大也。",
  "iching__2_4": "“括囊无咎”，慎不害也。",
  "iching__2_5": "“黄裳元吉”，文在中也。",
  "iching__2_6": "“龙战于野”，其道穷也。",
  "iching__2_7": "用六“永贞”，以大终也。",
  "iching__3": "云雷，屯。君子以经纶。",
  "iching__3_1": "虽磐桓，志行正也；以贵下贱，大得民也。",
  "iching__3_2": "六二之难，乘刚也。“十年乃字”，反常也。",
  "iching__3_3": "“即鹿无虞”，以从禽也。君子舍之；“往吝”，穷也。",
  "iching__3_4": "“求”而“往”，明也。",
  "iching__3_5": "“屯其膏”，施未光也。",
  "iching__3_6": "“泣血涟如”，何可长也？",
  "iching__4": "山下出泉，蒙。君子以果行育德。",
  "iching__4_1": "“利用刑人”，以正法也。",
  "iching__4_2": "“子克家”，刚柔接也。",
  "iching__4_3": "“勿用取女”，行不顺也。",
  "iching__4_4": "“困蒙”之“吝”，独远实也。",
  "iching__4_5": "“童蒙”之“吉”，顺以巽也。",
  "iching__4_6": "“利”用“御寇”，上下顺也。",
  "iching__5": "云上于天，需。君子以饮食宴乐。",
  "iching__5_1": "“需于郊”，不犯难行也；“利用恒，无咎”，未失常也。",
  "iching__5_2": "“需于沙”，衍在中也；虽“小有言”，以“吉”“终”也。",
  "iching__5_3": "“需于泥”，灾在外也；自我“致寇”，敬慎不败也。",
  "iching__5_4": "“需于血”，顺以听也。",
  "iching__5_5": "“酒食，贞吉”，以中正也。",
  "iching__5_6": "“不速之客”来，“敬之，终吉”，虽不当位，未大失也。",
  "iching__6": "天与水违行，讼。君子以作事谋始。",
  "iching__6_1": "“不永所事”，讼不可长也；虽“有小言”，其辩明也。",
  "iching__6_2": "“不克讼”，归逋，窜也；自下讼上，患至掇也。",
  "iching__6_3": "“食旧德”，从上吉也。",
  "iching__6_4": "“复即命，渝”，“安贞”不失也。",
  "iching__6_5": "“讼，元吉”，以中正也。",
  "iching__6_6": "以讼受服，亦不足敬也。",
  "iching__7": "地中有水，师。君子以容民畜众。",
  "iching__7_1": "“师出以律”，失律“凶”也。",
  "iching__7_2": "“在师中吉”，承天宠也；“王三锡命”，怀万邦也。",
  "iching__7_3": "“师或舆尸”，大无功也。",
  "iching__7_4": "“左次，无咎”，未失常也。",
  "iching__7_5": "“长子帅师”，以中行也；“弟子舆师”，使不当也。",
  "iching__7_6": "“大君有命”，以正功也；“小人勿用”，必乱邦也。",
  "iching__8": "地上有水，比。先王以建万国，亲诸侯。",
  "iching__8_1": "比之初六，有它吉也。",
  "iching__8_2": "“比之自内”，不自失也。",
  "iching__8_3": "“比之匪人”，不亦伤乎！",
  "iching__8_4": "“外比”于贤，以从上也。",
  "iching__8_5": "“显比”之吉，位正中也。舍逆取顺，“失前禽”也。“邑人不诫”，上使中也。",
  "iching__8_6": "“比之无首”，无所终也。",
  "iching__9": "风行天上，小畜。君子以懿文德。",
  "iching__9_1": "“复自道”，其义“吉”也。",
  "iching__9_2": "“牵复”在中，亦不自失也。",
  "iching__9_3": "“夫妻反目”，不能正室也。",
  "iching__9_4": "“有孚”“惕出”，上合志也。",
  "iching__9_5": "“有孚挛如”，不独富也。",
  "iching__9_6": "“既雨既处”，“德”积“载”也。“君子征凶”，有所疑也。",
  "iching__10": "上天下泽，履。君子以辨上下，定民志。",
  "iching__10_1": "“素履”之“往”，独行愿也。",
  "iching__10_2": "“幽人贞吉”，中不自乱也。",
  "iching__10_3": "“眇能视”，不足以有明也；“跛能履”，不足以与行也；“咥人之凶”，位不当也；“武人为于大君”，志刚也。",
  "iching__10_4": "“愬愬，终吉”，志行也。",
  "iching__10_5": "“夬履，贞厉”，位正当也。",
  "iching__10_6": "元吉在上，大有庆也。",
  "iching__11": "天地交，泰。后以财成天地之道，辅相天地之宜，以左右民。",
  "iching__11_1": "“拔茅”“征吉”，志在外也。",
  "iching__11_2": "“包荒”，“得尚于中行”，以光大也。",
  "iching__11_3": "“无往不复”，天地际也。",
  "iching__11_4": "“翩翩，不富”，皆失实也。“不戒以孚”，中心愿也。",
  "iching__11_5": "“以祉元吉”，中以行愿也。",
  "iching__11_6": "“城复于隍”，其命乱也。",
  "iching__12": "天地不交，否。君子以俭德辟难，不可荣以禄。",
  "iching__12_1": "“拔茅”“贞吉”，志在君也。",
  "iching__12_2": "“大人否，亨”，不乱群也。",
  "iching__12_3": "“包羞”，位不当也。",
  "iching__12_4": "“有命无咎”，志行也。",
  "iching__12_5": "“大人”之“吉”，位正当也。",
  "iching__12_6": "否终则倾，何可长也？",
  "iching__13": "天与火，同人。君子以类族辨物。",
  "iching__13_1": "出门同人，又谁“咎”也。",
  "iching__13_2": "“同人于宗”，吝道也。",
  "iching__13_3": "“伏戎于莽”，敌刚也；“三岁不兴”，安行也？",
  "iching__13_4": "“乘其墉”，义弗克也；其吉，则困而反则也。",
  "iching__13_5": "“同人”之先，以中直也。大师相遇，言相克也。",
  "iching__13_6": "“同人于郊”，志未得也。",
  "iching__14": "火在天上，大有。君子以遏恶扬善，顺天休命。",
  "iching__14_1": "大有初九，“无交害”也。",
  "iching__14_2": "“大车以载”，积中不败也。",
  "iching__14_3": "“公用亨于天子”，小人害也。",
  "iching__14_4": "“匪其彭，无咎”，明辨晢也。",
  "iching__14_5": "“厥孚交如”，信以发志也；“威如”之吉，易而无备也。",
  "iching__14_6": "大有上吉，“自天祐”也。",
  "iching__15": "地中有山，谦。君子以裒多益寡，称物平施。",
  "iching__15_1": "“谦谦君子”，卑以自牧也。",
  "iching__15_2": "“鸣谦，贞吉”，中心得也。",
  "iching__15_3": "“劳谦君子”，万民服也。",
  "iching__15_4": "“无不利，撝谦”，不违则也。",
  "iching__15_5": "“利用侵伐”，征不服也。",
  "iching__15_6": "“鸣谦”，志未得也；可“用行师”，“征邑国”也。",
  "iching__16": "雷出地奋，豫；先王以作乐崇德，殷荐之上帝，以配祖考。",
  "iching__16_1": "初六“鸣豫”，志穷“凶”也。",
  "iching__16_2": "“不终日，贞吉”，以中正也。",
  "iching__16_3": "“盱豫”“有悔”，位不当也。",
  "iching__16_4": "“由豫，大有得”，志大行也。",
  "iching__16_5": "六五“贞疾”，乘刚也；“恒不死”，中未亡也。",
  "iching__16_6": "“冥豫”在上，何可长也？",
  "iching__17": "泽中有雷，随。君子以向晦入宴息。",
  "iching__17_1": "“官有渝”，从正“吉”也；“出门交有功”，不失也。",
  "iching__17_2": "“系小子”，弗兼与也。",
  "iching__17_3": "“系丈夫”，志舍下也。",
  "iching__17_4": "“随有获”，其义“凶”也；“有孚在道”，明功也。",
  "iching__17_5": "“孚于嘉，吉”，位正中也。",
  "iching__17_6": "“拘系之”，上穷也。",
  "iching__18": "山下有风，蛊。君子以振民育德。",
  "iching__18_1": "“干父之蛊”，意承考也。",
  "iching__18_2": "“干母之蛊”，得中道也。",
  "iching__18_3": "“干父之蛊”，终“无咎”也。",
  "iching__18_4": "“裕父之蛊”，往未得也。",
  "iching__18_5": "“干父”“用誉”，承以德也。",
  "iching__18_6": "“不事王侯”，志可则也。",
  "iching__19": "泽上有地，临。君子以教思无穷，容保民无疆。",
  "iching__19_1": "“咸临，贞吉”，志行正也。",
  "iching__19_2": "“咸临，吉，无不利”，未顺命也。",
  "iching__19_3": "“甘临”，位不当也；“既忧之”，“咎”不长也。",
  "iching__19_4": "“至临，无咎”，位当也。",
  "iching__19_5": "“大君之宜”，行中之谓也。",
  "iching__19_6": "“敦临”之“吉”，志在内也。",
  "iching__20": "风行地上，观。先王以省方观民设教。",
  "iching__20_1": "初六“童观”，小人道也。",
  "iching__20_2": "“窥观”“女贞”，亦可丑也。",
  "iching__20_3": "“观我生，进退”，未失道也。",
  "iching__20_4": "“观国之光”，尚“宾”也。",
  "iching__20_5": "“观我生”，观民也。",
  "iching__20_6": "“观其生”，志未平也。",
  "iching__21": "雷电，噬嗑。先王以明罚敕法。",
  "iching__21_1": "“屦校灭趾”，不行也。",
  "iching__21_2": "“噬肤灭鼻”，乘刚也。",
  "iching__21_3": "“遇毒”，位不当也。",
  "iching__21_4": "“利艰贞吉”，未光也。",
  "iching__21_5": "“贞厉无咎”，得当也。",
  "iching__21_6": "“何校灭耳”，聪不明也。",
  "iching__22": "山下有火，贲。君子以明庶政，无敢折狱。",
  "iching__22_1": "“舍车而徒”，义弗乘也。",
  "iching__22_2": "“贲其须”，与上兴也。",
  "iching__22_3": "“永贞”之“吉”，终莫之陵也。",
  "iching__22_4": "六四，当位疑也；“匪寇，婚媾”，终无尤也。",
  "iching__22_5": "六五之吉，有喜也。",
  "iching__22_6": "白贲，无咎，上得志也。",
  "iching__23": "山附于地，剥。上以厚下安宅。",
  "iching__23_1": "“剥床以足”，以灭下也。",
  "iching__23_2": "“剥床以辨”，未有与也。",
  "iching__23_3": "“剥之，无咎”，失上下也。",
  "iching__23_4": "“剥床以肤”，切近灾也。",
  "iching__23_5": "“以宫人宠”，终无尤也。",
  "iching__23_6": "“君子得舆”，民所载也；“小人剥庐”，终不可用也。",
  "iching__24": "雷在地中，复。先王以至日闭关，商旅不行，后不省方。",
  "iching__24_1": "“不远”之“复”，以修身也。",
  "iching__24_2": "“休复”之“吉”，以下仁也。",
  "iching__24_3": "“频复”之“厉”，义“无咎”也。",
  "iching__24_4": "“中行独复”，以从道也。",
  "iching__24_5": "“敦复，无悔”，中以自考也。",
  "iching__24_6": "“迷复”之“凶”，反君道也。",
  "iching__25": "天下雷行，物与无妄。先王以茂对时，育万物。",
  "iching__25_1": "“无妄”之“往”，得志也。",
  "iching__25_2": "“不耕获”，未富也。",
  "iching__25_3": "“行人”得牛，“邑人”灾也。",
  "iching__25_4": "“可贞，无咎”，固有之也。",
  "iching__25_5": "“无妄”之“药”，不可试也。",
  "iching__25_6": "“无妄”之“行”，穷之灾也。",
  "iching__26": "天在山中，大畜。君子以多识前言往行，以畜其德。",
  "iching__26_1": "“有厉，利已”，不犯灾也。",
  "iching__26_2": "“舆说輹”，中无尤也。",
  "iching__26_3": "“利有攸往”，上合志也。",
  "iching__26_4": "六四“元吉”，有喜也。",
  "iching__26_5": "六五之“吉”，有庆也。",
  "iching__26_6": "“何天之衢”，道大行也。",
  "iching__27": "山下有雷，颐。君子以慎言语，节饮食。",
  "iching__27_1": "“观我朵颐”，亦不足贵也。",
  "iching__27_2": "六二“征凶”，行失类也。",
  "iching__27_3": "“十年勿用”，道大悖也。",
  "iching__27_4": "“颠颐”之“吉”，上施光也。",
  "iching__27_5": "“居贞”之“吉”，顺以从上也。",
  "iching__27_6": "“由颐，厉吉”，大有庆也。",
  "iching__28": "泽灭木，大过；君子以独立不惧，遁世无闷。",
  "iching__28_1": "“藉用白茅”，柔在下也。",
  "iching__28_2": "“老夫”“女妻”，过以相与也。",
  "iching__28_3": "“栋桡”之“凶”，不可以有辅也。",
  "iching__28_4": "“栋隆”之“吉”，不桡乎下也。",
  "iching__28_5": "“枯杨生华”，何可久也？“老妇”“士夫”，亦可丑也。",
  "iching__28_6": "“过涉”之“凶”，不可咎也。",
  "iching__29": "水洊至，习坎。君子以常德行，习教事。",
  "iching__29_1": "“习坎”入坎，失道凶也。",
  "iching__29_2": "“求小得”，未出中也。",
  "iching__29_3": "“来之坎坎”，终无功也。",
  "iching__29_4": "“樽酒，簋贰”，刚柔际也。",
  "iching__29_5": "“坎不盈”，中未大也。",
  "iching__29_6": "上六失道，凶“三岁”也。",
  "iching__30": "明两作，离。大人以继明照于四方。",
  "iching__30_1": "“履错”之“敬”，以辟咎也。",
  "iching__30_2": "“黄离，元吉”，得中道也。",
  "iching__30_3": "“日昃之离”，何可久也！",
  "iching__30_4": "“突如其来如”，无所容也。",
  "iching__30_5": "六五之“吉”，离王公也。",
  "iching__30_6": "“王用出征”，以正邦也。",
  "iching__31": "山上有泽，咸。君子以虚受人。",
  "iching__31_1": "“咸其拇”，志在外也。",
  "iching__31_2": "虽“凶”“居吉”，顺不害也。",
  "iching__31_3": "“咸其股”，亦不处也。志在随人，所执下也。",
  "iching__31_4": "“贞吉，悔亡”，未感害也；“憧憧往来”，未光大也。",
  "iching__31_5": "“咸其脢”，志未也。",
  "iching__31_6": "“咸其辅颊舌”，滕口说也。",
  "iching__32": "雷风，恒。君子以立不易方。",
  "iching__32_1": "“浚恒”之“凶”，始求深也。",
  "iching__32_2": "九二“悔亡”，能久中也。",
  "iching__32_3": "“不恒其德”，无所容也。",
  "iching__32_4": "久非其位，安得禽也？",
  "iching__32_5": "“妇人”贞吉，从一而终也。“夫子”制义，从妇凶也。",
  "iching__32_6": "“振恒”在上，大无功也。",
  "iching__33": "天下有山，遁。君子以远小人，不恶而严。",
  "iching__33_1": "“遁尾”之“厉”，不往，何灾也？",
  "iching__33_2": "“执用黄牛”，固志也。",
  "iching__33_3": "“系遁之厉”，有疾惫也；“畜臣妾，吉”，不可大事也。",
  "iching__33_4": "“君子”“好遁”，“小人否”也。",
  "iching__33_5": "“嘉遁，贞吉”，以正志也。",
  "iching__33_6": "“肥遁，无不利”，无所疑也。",
  "iching__34": "雷在天上，大壮。君子以非礼弗履。",
  "iching__34_1": "“壮于趾”，其孚穷也。",
  "iching__34_2": "九二“贞吉”，以中也。",
  "iching__34_3": "“小人用壮”，“君子”“罔”也。",
  "iching__34_4": "“藩决不羸”，尚往也。",
  "iching__34_5": "“丧羊于易”，位不当也。",
  "iching__34_6": "“不能退，不能遂”，不详也；“艰则吉”，咎不长也。",
  "iching__35": "明出地上，晋。君子以自昭明德。",
  "iching__35_1": "“晋中摧如”，独行正也。“裕无咎”，未受命也。",
  "iching__35_2": "“受兹介福”，以中正也。",
  "iching__35_3": "“众允”之志，上行也。",
  "iching__35_4": "“鼫鼠”“贞厉”，位不当也。",
  "iching__35_5": "“失得勿恤”，往有庆也。",
  "iching__35_6": "“维用伐邑”，道未光也。",
  "iching__36": "明入地中，明夷。君子以莅众，用晦而明。",
  "iching__36_1": "“君子于行”，义不食也。",
  "iching__36_2": "六二之“吉”，顺以则也。",
  "iching__36_3": "“南狩”之志，乃大得也。",
  "iching__36_4": "“入于左腹”，获心意也。",
  "iching__36_5": "“箕子”之“贞”，明不可息也。",
  "iching__36_6": "“初登于天”，照四国也。“后入于地”，失则也。",
  "iching__37": "风自火出，家人。君子以言有物而行有恒。",
  "iching__37_1": "“闲有家”，志未变也。",
  "iching__37_2": "六二之“吉”，顺以巽也。",
  "iching__37_3": "“家人嗃嗃”，未失也；“妇子嘻嘻”，失家节也。",
  "iching__37_4": "“富家，大吉”，顺在位也。",
  "iching__37_5": "“王假有家”，交相爱也。",
  "iching__37_6": "“威如”之“吉”，反身之谓也。",
  "iching__38": "上火下泽，睽；君子以同而异。",
  "iching__38_1": "“见恶人”，以辟咎也。",
  "iching__38_2": "“遇主于巷”，未失道也。",
  "iching__38_3": "“见舆曳”，位不当也。“无初有终”，遇刚也。",
  "iching__38_4": "“交孚”“无咎”，志行也。",
  "iching__38_5": "“厥宗噬肤”，往有庆也。",
  "iching__38_6": "“遇雨”之“吉”，群疑亡也。",
  "iching__39": "山上有水，蹇。君子以反身修德。",
  "iching__39_1": "“往蹇，来誉”，宜待也。",
  "iching__39_2": "“王臣蹇蹇”，终无尤也。",
  "iching__39_3": "“往蹇，来反”，内喜之也。",
  "iching__39_4": "“往蹇，来连”，当位实也。",
  "iching__39_5": "“大蹇，朋来”，以中节也。",
  "iching__39_6": "“往蹇，来硕”，志在内也；“利见大人”，以从贵也。",
  "iching__40": "雷雨作，解。君子以赦过宥罪。",
  "iching__40_1": "刚柔之际，义“无咎”也。",
  "iching__40_2": "九二“贞吉”，得中道也。",
  "iching__40_3": "“负且乘”，亦可丑也；自我致戎，又谁咎也？",
  "iching__40_4": "“解而拇”，未当位也。",
  "iching__40_5": "“君子”“有解”，小人退也。",
  "iching__40_6": "“公用射隼”，以解悖也。",
  "iching__41": "山下有泽，损。君子以惩忿窒欲。",
  "iching__41_1": "“已事遄往”，尚合志也。",
  "iching__41_2": "九二“利贞”，中以为志也。",
  "iching__41_3": "“一人行”，三则疑也。",
  "iching__41_4": "“损其疾”，亦可喜也。",
  "iching__41_5": "六五“元吉”，自上祐也。",
  "iching__41_6": "“弗损益之”，大得志也。",
  "iching__42": "风雷，益。君子以见善则迁，有过则改。",
  "iching__42_1": "“元吉，无咎”，下不厚事也。",
  "iching__42_2": "“或益之”，自外来也。",
  "iching__42_3": "益“用凶事”，固有之也。",
  "iching__42_4": "“告公从”，以益志也。",
  "iching__42_5": "“有孚惠心”，“勿问”之矣；“惠我德”，大得志也。",
  "iching__42_6": "“莫益之”，偏辞也；“或击之”，自外来也。",
  "iching__43": "泽上于天，夬。君子以施禄及下，居德则忌。",
  "iching__43_1": "“不胜”而“往”，咎也。",
  "iching__43_2": "“有戎”“勿恤”，得中道也。",
  "iching__43_3": "“君子夬夬”，终无咎也。",
  "iching__43_4": "“其行次且”，位不当也；“闻言不信”，聪不明也。",
  "iching__43_5": "“中行无咎”，中未光也。",
  "iching__43_6": "“无号”之“凶”，终不可长也。",
  "iching__44": "天下有风，姤。后以施命诰四方。",
  "iching__44_1": "“系于金柅”，柔道牵也。",
  "iching__44_2": "“包有鱼”，义不及宾也。",
  "iching__44_3": "“其行次且”，行未牵也。",
  "iching__44_4": "“无鱼”之“凶”，远民也。",
  "iching__44_5": "九五“含章”，中正也；“有陨自天”，志不舍命也。",
  "iching__44_6": "“姤其角”，上穷吝也。",
  "iching__45": "泽上于地，萃。君子以除戎器，戒不虞。",
  "iching__45_1": "“乃乱乃萃”，其志乱也。",
  "iching__45_2": "“引吉，无咎”，中未变也。",
  "iching__45_3": "“往无咎”，上巽也。",
  "iching__45_4": "“大吉，无咎”，位不当也。",
  "iching__45_5": "“萃有位”，志未光也。",
  "iching__45_6": "“赍咨涕洟”，未安上也。",
  "iching__46": "地中生木，升。君子以顺德，积小以高大。",
  "iching__46_1": "“允升，大吉”，上合志也。",
  "iching__46_2": "九二之“孚”，有喜也。",
  "iching__46_3": "“升虚邑”，无所疑也。",
  "iching__46_4": "“王用亨于岐山”，顺事也。",
  "iching__46_5": "“贞吉，升阶”，大得志也。",
  "iching__46_6": "“冥升在上”，消不富也。",
  "iching__47": "泽无水，困。君子以致命遂志。",
  "iching__47_1": "“入于幽谷”，幽不明也。",
  "iching__47_2": "“困于酒食”，中有庆也。",
  "iching__47_3": "“据于蒺藜”，乘刚也；“入于其宫，不见其妻”，不祥也。",
  "iching__47_4": "“来徐徐”，志在下也；虽不当位，有与也。",
  "iching__47_5": "“劓刖”，志未得也。“乃徐有说”，以中直也。“利用祭祀”，受福也。",
  "iching__47_6": "“困于葛藟”，未当也；“动悔，有悔”，吉行也。",
  "iching__48": "木上有水，井。君子以劳民劝相。",
  "iching__48_1": "“井泥不食”，下也；“旧井无禽”，时舍也。",
  "iching__48_2": "“井谷射鲋”，无与也。",
  "iching__48_3": "“井渫不食”，行恻也；求“王明”，受福也。",
  "iching__48_4": "“井甃，无咎”，修井也。",
  "iching__48_5": "“寒泉”之“食”，中正也。",
  "iching__48_6": "“元吉”在上，大成也。",
  "iching__49": "泽中有火，革。君子以治历明时。",
  "iching__49_1": "“巩用黄牛”，不可以有为也。",
  "iching__49_2": "“巳日”“革之”，行有嘉也。",
  "iching__49_3": "“革言三就”，又何之矣！",
  "iching__49_4": "“改命”之“吉”，信志也。",
  "iching__49_5": "“大人虎变”，其文炳也。",
  "iching__49_6": "“君子豹变”，其文蔚也；“小人革面”，顺以从君也。",
  "iching__50": "木上有火，鼎。君子以正位凝命。",
  "iching__50_1": "“鼎颠趾”，未悖也；“利出否”，以从贵也。",
  "iching__50_2": "“鼎有实”，慎所之也；“我仇有疾”，终无尤也。",
  "iching__50_3": "“鼎耳革”，失其义也。",
  "iching__50_4": "“覆公餗”，信如何也。",
  "iching__50_5": "“鼎黄耳”，中以为实也。",
  "iching__50_6": "“玉铉”在上，刚柔节也。",
  "iching__51": "洊雷，震。君子以恐惧修省。",
  "iching__51_1": "“震来虩虩”，恐致福也；“笑言哑哑”，后有则也。",
  "iching__51_2": "“震来厉”，乘刚也。",
  "iching__51_3": "“震苏苏”，位不当也。",
  "iching__51_4": "“震遂泥”，未光也。",
  "iching__51_5": "“震往来，厉”，危行也；其事在中，大无丧也。",
  "iching__51_6": "“震索索”，中未得也；虽“凶”“无咎”，畏邻戒也。",
  "iching__52": "兼山，艮。君子以思不出其位。",
  "iching__52_1": "“艮其趾”，未失正也。",
  "iching__52_2": "“不拯其随”，未退听也。",
  "iching__52_3": "“艮其限”，危“熏心”也。",
  "iching__52_4": "“艮其身”，止诸躬也。",
  "iching__52_5": "“艮其辅”，以中正也。",
  "iching__52_6": "“敦艮”之“吉”，以厚终也。",
  "iching__53": "山上有木，渐。君子以居贤德善俗。",
  "iching__53_1": "“小子”之“厉”，义无咎也。",
  "iching__53_2": "“饮食衎衎”，不素饱也。",
  "iching__53_3": "“夫征不复”，离群丑也；“妇孕不育”，失其道也；“利”用“御寇”，顺相保也。",
  "iching__53_4": "“或得其桷”，顺以巽也。",
  "iching__53_5": "“终莫之胜，吉”，得所愿也。",
  "iching__53_6": "“其羽可用为仪，吉”，不可乱也。",
  "iching__54": "泽上有雷，归妹。君子以永终知敝。",
  "iching__54_1": "“归妹以娣”，以恒也；“跛能履”“吉”，相承也。",
  "iching__54_2": "“利幽人之贞”，未变常也。",
  "iching__54_3": "“归妹以须”，未当也。",
  "iching__54_4": "“愆期”之志，有待而行也。",
  "iching__54_5": "“帝乙归妹”，“不如其娣之袂良”也，其位在中，以贵行也。",
  "iching__54_6": "上六“无实”，“承”虚“筐”也。",
  "iching__55": "雷电皆至，丰。君子以折狱致刑。",
  "iching__55_1": "“虽旬无咎”，过旬灾也。",
  "iching__55_2": "“有孚发若”，信以发志也。",
  "iching__55_3": "“丰其沛”，不可大事也；“折其右肱”，终不可用也。",
  "iching__55_4": "“丰其蔀”，位不当也；“日中见斗”，幽不明也；“遇其夷主，吉”，行也。",
  "iching__55_5": "六五之“吉”，“有庆”也。",
  "iching__55_6": "“丰其屋”，天际翔也；“窥其户，阒其无人”，自藏也。",
  "iching__56": "山上有火，旅。君子以明慎用刑而不留狱。",
  "iching__56_1": "“旅琐琐”，志穷灾也。",
  "iching__56_2": "“得童仆，贞”，终无尤也。",
  "iching__56_3": "“旅焚其次”，亦以伤矣；以旅与下，其义“丧”也。",
  "iching__56_4": "“旅于处”，未得位也；“得其资斧”，心未快也。",
  "iching__56_5": "“终以誉命”，上逮也。",
  "iching__56_6": "以旅在上，其义“焚”也；“丧牛于易”，终莫之闻也。",
  "iching__57": "随风，巽。君子以申命行事。",
  "iching__57_1": "“进退”，志疑也；“利武人之贞”，志治也。",
  "iching__57_2": "“纷若”之“吉”，得中也。",
  "iching__57_3": "“频巽”之“吝”，志穷也。",
  "iching__57_4": "“田获三品”，有功也。",
  "iching__57_5": "九五之“吉”，位正中也。",
  "iching__57_6": "“巽在床下”，上穷也；“丧其资斧”，正乎“凶”也。",
  "iching__58": "丽泽，兑。君子以朋友讲习。",
  "iching__58_1": "“和兑”之“吉”，行未疑也。",
  "iching__58_2": "“孚兑”之“吉”，信志也。",
  "iching__58_3": "“来兑”之“凶”，位不当也。",
  "iching__58_4": "九四之“喜”，有庆也。",
  "iching__58_5": "“孚于剥”，位正当也。",
  "iching__58_6": "上六“引兑”，未光也。",
  "iching__59": "风行水上，涣。先王以享于帝，立庙。",
  "iching__59_1": "初六之“吉”，顺也。",
  "iching__59_2": "“涣奔其机”，得愿也。",
  "iching__59_3": "“涣其躬”，志在外也。",
  "iching__59_4": "“涣其群，元吉”，光大也。",
  "iching__59_5": "“王居”“无咎”，正位也。",
  "iching__59_6": "“涣其血”，远害也。",
  "iching__60": "泽上有水，节。君子以制数度，议德行。",
  "iching__60_1": "“不出户庭”，知通塞也。",
  "iching__60_2": "“不出门庭，凶”，失时极也。",
  "iching__60_3": "“不节”之“嗟”，又谁“咎”也？",
  "iching__60_4": "“安节”之“亨”，承上道也。",
  "iching__60_5": "“甘节”之“吉”，居位中也。",
  "iching__60_6": "“苦节，贞凶”，其道穷也。",
  "iching__61": "泽上有风，中孚。君子以议狱缓死。",
  "iching__61_1": "初九“虞吉”，志未变也。",
  "iching__61_2": "“其子和之”，中心愿也。",
  "iching__61_3": "“或鼓或罢”，位不当也。",
  "iching__61_4": "“马匹亡”，绝类上也。",
  "iching__61_5": "“有孚挛如”，位正当也。",
  "iching__61_6": "“翰音登于天”，何可长也！",
  "iching__62": "山上有雷，小过。君子以行过乎恭，丧过乎哀，用过乎俭。",
  "iching__62_1": "“飞鸟以凶”，不可如何也。",
  "iching__62_2": "“不及其君”，臣不可过也。",
  "iching__62_3": "“从或戕之”，凶如何也。",
  "iching__62_4": "“弗过遇之”，位不当也；“往厉必戒”，终不可长也。",
  "iching__62_5": "“密云不雨”，已上也。",
  "iching__62_6": "“弗遇过之”，已亢也。",
  "iching__63": "水在火上，既济。君子以思患而豫防之。",
  "iching__63_1": "“曳其轮”，义无咎也。",
  "iching__63_2": "“七日得”，以中道也。",
  "iching__63_3": "“三年克之”，惫也。",
  "iching__63_4": "终日戒，有所疑也。",
  "iching__63_5": "“东邻杀牛，不如西邻”之时也；“实受其福”，吉大来也。",
  "iching__63_6": "“濡其首，厉”，何可久也！",
  "iching__64": "火在水上，未济。君子以慎辨物居方。",
  "iching__64_1": "“濡其尾”，亦不知极也。",
  "iching__64_2": "九二“贞吉”，中以行正也。",
  "iching__64_3": "“未济，征凶”，位不当也。",
  "iching__64_4": "“贞吉，悔亡”，志行也。",
  "iching__64_5": "“君子之光”，其晖“吉”也。",
  "iching__64_6": "“饮酒”濡首，亦不知节也。"
};

export const ZHOUYI_CLASSICS = new Map<number, ClassicalHexagram>(
  rawHexagrams.map((hexagram) => [hexagram.id, {
    number: hexagram.id,
    name: hexagram.name,
    symbol: hexagram.symbol,
    judgment: hexagram.scripture,
    image: imageTexts[`iching__${hexagram.id}`] ?? "",
    lines: hexagram.lines.map((line) => ({
      id: line.id,
      type: line.type,
      name: line.name,
      text: line.scripture,
      image: imageTexts[`iching__${hexagram.id}_${line.id}`] ?? "",
    })),
  }]),
);

