"""Life Mirror / tools - Liuyao Engine: 装卦 (deterministic hexagram assembly).
定卦宫 / 世应 / 纳甲 / 六亲 / 六神 / 旬空 / 变卦.  Zero randomness, zero LLM.
"""
TRIGRAMS = {
    "乾": ([1,1,1], "金"), "兑": ([1,1,0], "金"), "离": ([1,0,1], "火"),
    "震": ([1,0,0], "木"), "巽": ([0,1,1], "木"), "坎": ([0,1,0], "水"),
    "艮": ([0,0,1], "土"), "坤": ([0,0,0], "土"),
}
LINES2TRI = {tuple(v[0]): k for k, v in TRIGRAMS.items()}
NAJIA = {
    "乾": (["子","寅","辰"], ["午","申","戌"], "甲", "壬"),
    "坤": (["未","巳","卯"], ["丑","亥","酉"], "乙", "癸"),
    "震": (["子","寅","辰"], ["午","申","戌"], "庚", "庚"),
    "巽": (["丑","亥","酉"], ["未","巳","卯"], "辛", "辛"),
    "坎": (["寅","辰","午"], ["申","戌","子"], "戊", "戊"),
    "离": (["卯","丑","亥"], ["酉","未","巳"], "己", "己"),
    "艮": (["辰","午","申"], ["戌","子","寅"], "丙", "丙"),
    "兑": (["巳","卯","丑"], ["亥","酉","未"], "丁", "丁"),
}
ZHI_WX = {"子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火","午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水"}
SHENG = {"木":"火","火":"土","土":"金","金":"水","水":"木"}
KE = {"木":"土","土":"水","水":"火","火":"金","金":"木"}
GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]

def liuqin(pe, le):
    if le == pe: return "兄弟"
    if SHENG[le] == pe: return "父母"
    if SHENG[pe] == le: return "子孙"
    if KE[le] == pe: return "官鬼"
    if KE[pe] == le: return "妻财"
    return "?"

NAME = {
 "乾":{"乾":"乾为天","坤":"地天泰","坎":"水天需","离":"火天大有","震":"雷天大壮","巽":"风天小畜","艮":"山天大畜","兑":"泽天夬"},
 "坤":{"乾":"天地否","坤":"坤为地","坎":"水地比","离":"火地晋","震":"雷地豫","巽":"风地观","艮":"山地剥","兑":"泽地萃"},
 "坎":{"乾":"天水讼","坤":"地水师","坎":"坎为水","离":"火水未济","震":"雷水解","巽":"风水涣","艮":"山水蒙","兑":"泽水困"},
 "离":{"乾":"天火同人","坤":"地火明夷","坎":"水火既济","离":"离为火","震":"雷火丰","巽":"风火家人","艮":"山火贲","兑":"泽火革"},
 "震":{"乾":"天雷无妄","坤":"地雷复","坎":"水雷屯","离":"火雷噬嗑","震":"震为雷","巽":"风雷益","艮":"山雷颐","兑":"泽雷随"},
 "巽":{"乾":"天风姤","坤":"地风升","坎":"水风井","离":"火风鼎","震":"雷风恒","巽":"巽为风","艮":"山风蛊","兑":"泽风大过"},
 "艮":{"乾":"天山遁","坤":"地山谦","坎":"水山蹇","离":"火山旅","震":"雷山小过","巽":"风山渐","艮":"艮为山","兑":"泽山咸"},
 "兑":{"乾":"天泽履","坤":"地泽临","坎":"水泽节","离":"火泽睽","震":"雷泽归妹","巽":"风泽中孚","艮":"山泽损","兑":"兑为泽"},
}
def hexname(lines):
    lo = LINES2TRI[tuple(lines[0:3])]; up = LINES2TRI[tuple(lines[3:6])]
    return NAME[lo][up]
def line_zhis(lines):
    lo = LINES2TRI[tuple(lines[0:3])]; up = LINES2TRI[tuple(lines[3:6])]
    return NAJIA[lo][0] + NAJIA[up][1]
def line_gans(lines):
    lo = LINES2TRI[tuple(lines[0:3])]; up = LINES2TRI[tuple(lines[3:6])]
    return [NAJIA[lo][2]]*3 + [NAJIA[up][3]]*3

FLIP = {"本宫":[], "一世":[0], "二世":[0,1], "三世":[0,1,2], "四世":[0,1,2,3], "五世":[0,1,2,3,4], "游魂":[0,1,2,4], "归魂":[4]}
WORLD = {"本宫":6,"一世":1,"二世":2,"三世":3,"四世":4,"五世":5,"游魂":4,"归魂":3}
def _resp(w): return w+3 if w<=3 else w-3
PALACE = {}
for _pn, _pv in TRIGRAMS.items():
    _tri, _pe = _pv; _pure = _tri + _tri
    for _tp, _idxs in FLIP.items():
        _pat = _pure[:]
        for _i in _idxs: _pat[_i] ^= 1
        PALACE[tuple(_pat)] = (_pn, _pe, WORLD[_tp], _resp(WORLD[_tp]), _tp)

SHEN = ["青龙","朱雀","勾陈","螣蛇","白虎","玄武"]
SHEN_START = {"甲":0,"乙":0,"丙":1,"丁":1,"戊":2,"己":3,"庚":4,"辛":4,"壬":5,"癸":5}
def xunkong(dg, dz):
    v = (ZHI.index(dz) - GAN.index(dg) + 10) % 12
    return [ZHI[v], ZHI[(v+1) % 12]]

def assemble(lines_raw, day=None):
    """lines_raw: 6 tosses bottom->top, each in {6 老阴,7 少阳,8 少阴,9 老阳}."""
    ben = [1 if v in (7,9) else 0 for v in lines_raw]
    mov = [v in (6,9) for v in lines_raw]
    pal = PALACE[tuple(ben)]; pe = pal[1]
    zhis = line_zhis(ben); gans = line_gans(ben)
    shen = [None]*6; kong = []
    if day:
        dg, dz = day; s = SHEN_START[dg]
        shen = [SHEN[(s+i) % 6] for i in range(6)]; kong = xunkong(dg, dz)
    yao = []
    for i in range(6):
        z = zhis[i]; wx = ZHI_WX[z]
        yao.append({"位": i+1, "阴阳": "阳" if ben[i] else "阴", "干支": gans[i]+z, "五行": wx,
                    "六亲": liuqin(pe, wx), "六神": shen[i],
                    "世应": "世" if i+1 == pal[2] else ("应" if i+1 == pal[3] else ""),
                    "动": mov[i], "空": z in kong})
    out = {"本卦": {"名": hexname(ben), "卦宫": pal[0], "卦宫五行": pe, "卦型": pal[4],
                    "世爻": pal[2], "应爻": pal[3], "六爻": yao}}
    movers = [i for i in range(6) if mov[i]]
    if movers:
        bian = [(ben[i] ^ 1) if mov[i] else ben[i] for i in range(6)]
        bp = PALACE[tuple(bian)]; bz = line_zhis(bian); bg = line_gans(bian)
        out["变卦"] = {"名": hexname(bian), "卦宫": bp[0], "卦宫五行": bp[1], "卦型": bp[4],
                       "世爻": bp[2], "应爻": bp[3], "动爻变": {i+1: bg[i]+bz[i] for i in movers}}
        out["动爻"] = [i+1 for i in movers]
    else:
        out["变卦"] = None; out["动爻"] = []
    return out
