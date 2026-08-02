"""Liuyao engine regression tests.  Run: python tests/test_liuyao.py  或  python -m pytest tests/"""
import os, sys
# 让 `liuyao` 包可被导入(把包的父目录加入 path;与放置在 repo 何处无关)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from liuyao.engine import PALACE, assemble, TRIGRAMS
from liuyao.analysis import full_reading

def _pat(lo, up): return tuple(TRIGRAMS[lo][0] + TRIGRAMS[up][0])
def test_palace_count():
    assert len(PALACE) == 64
def test_palace_world():
    cases = [("乾","乾","乾","本宫",6),("离","兑","坎","四世",4),("乾","离","乾","归魂",3),
             ("坤","坎","坤","归魂",3),("坎","震","震","二世",2),("坤","离","乾","游魂",4),
             ("坎","巽","离","五世",5),("坤","艮","乾","五世",5)]
    for lo, up, pal, tp, w in cases:
        p = PALACE[_pat(lo, up)]
        assert p[0] == pal and p[4] == tp and p[2] == w, (lo, up, p)
def test_liuqin_qian():
    a = assemble([7,7,7,7,7,7])
    assert [y["六亲"] for y in a["本卦"]["六爻"]] == ["子孙","妻财","父母","官鬼","兄弟","父母"]
def test_geming():
    a = assemble([7,8,9,7,7,8], day=("乙","卯"))
    assert a["本卦"]["名"] == "泽火革" and a["本卦"]["卦宫"] == "坎"
    assert a["变卦"]["名"] == "泽雷随"
    assert [y["六亲"] for y in a["本卦"]["六爻"]] == ["子孙","官鬼","兄弟","兄弟","父母","官鬼"]
def test_xunkong():
    a = assemble([7,7,7,7,7,7], day=("甲","子"))
    kong = [y["空"] for y in a["本卦"]["六爻"]]
    assert kong[5] is True and sum(1 for k in kong if k) == 1
def test_fushen_present():
    fr = full_reading([8,7,7,7,7,7], "求财", "寅", ("甲","子"))
    assert fr["用神分析"]["不上卦"] is True
    fs = fr["用神分析"]["伏神"]
    assert fs is not None and fs["伏神六亲"] == "妻财" and fs["爻位"] == 2
def test_contract_keys():
    fr = full_reading([6,7,7,7,8,8], "事业", "未", ("戊","申"))
    for k in ["卦象事实","用神分析","断语要点","整体倾向","不确定度","应期","元数据"]:
        assert k in fr
    assert fr["卦象事实"]["本卦"]["名"] == "雷风恒"

if __name__ == "__main__":
    import traceback
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    ok = 0
    for t in tests:
        try:
            t(); print("PASS " + t.__name__); ok += 1
        except Exception as e:
            print("FAIL " + t.__name__ + " " + repr(e)); traceback.print_exc()
    print(str(ok) + "/" + str(len(tests)) + " passed")
