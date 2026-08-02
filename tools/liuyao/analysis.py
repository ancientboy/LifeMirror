"""Life Mirror / tools - Liuyao Engine: 断卦 (用神 / 旺衰 / 伏神 / 生克 / 应期) + full_reading."""
from .engine import (TRIGRAMS, ZHI_WX, SHENG, KE, assemble, liuqin, line_zhis)

CHONG = [("子","午"),("丑","未"),("寅","申"),("卯","酉"),("辰","戌"),("巳","亥")]
HE = [("子","丑"),("寅","亥"),("卯","戌"),("辰","酉"),("巳","申"),("午","未")]
def _pair(a, b, pairs): return (a, b) in pairs or (b, a) in pairs
def chong_of(z):
    for a, b in CHONG:
        if a == z: return b
        if b == z: return a
def he_of(z):
    for a, b in HE:
        if a == z: return b
        if b == z: return a
MU = {"木":"未","火":"戌","金":"丑","水":"辰","土":"辰"}

CATEGORY_YONGSHEN = {
 "求财":"妻财","财运":"妻财","投资":"妻财",
 "事业":"官鬼","工作":"官鬼","官运":"官鬼","功名":"官鬼","求职":"官鬼","官司":"官鬼",
 "考试":"父母","学业":"父母","文书":"父母","房产":"父母","合同":"父母","车":"父母","长辈":"父母",
 "子女":"子孙","健康":"子孙","医药":"子孙","宠物":"子孙","出行平安":"子孙","解忧":"子孙",
 "兄弟":"兄弟","朋友":"兄弟","同事":"兄弟","竞争":"兄弟","合伙":"兄弟",
 "婚姻男测":"妻财","婚姻女测":"官鬼","自身":"世",
}
def wangshuai(elem, month):
    me = ZHI_WX[month]
    if elem == me: return "旺"
    if SHENG[me] == elem: return "相"
    if SHENG[elem] == me: return "休"
    if KE[elem] == me: return "囚"
    return "死"
WS_SCORE = {"旺":2,"相":1,"休":0,"囚":-1,"死":-1}
def rel_to(z, ref):
    tags = []; ze = ZHI_WX[z]; re = ZHI_WX[ref]
    if z == ref: tags.append("临")
    if _pair(z, ref, CHONG): tags.append("冲")
    if _pair(z, ref, HE): tags.append("合")
    if ze == re and not (z == ref): tags.append("比和")
    elif SHENG[re] == ze: tags.append("受生")
    elif KE[re] == ze: tags.append("受克")
    elif SHENG[ze] == re: tags.append("泄气")
    elif KE[ze] == re: tags.append("耗力")
    return tags
FORWARD = {("寅","卯"),("巳","午"),("申","酉"),("亥","子")}
def role_vs(de, YE):
    if de == YE: return "同类"
    if SHENG[de] == YE: return "原神"
    if KE[de] == YE: return "忌神"
    if SHENG[YE] == de: return "泄神"
    if KE[YE] == de: return "受制"
    return ""
def origin_of(YE):
    for e in ["木","火","土","金","水"]:
        if SHENG[e] == YE: return e
def ji_of(YE):
    for e in ["木","火","土","金","水"]:
        if KE[e] == YE: return e
def hui_tou(dz, bz):
    de = ZHI_WX[dz]; be = ZHI_WX[bz]
    if de == be:
        if (dz, bz) in FORWARD: return "化进神"
        if (bz, dz) in FORWARD: return "化退神"
        return "化比和"
    if SHENG[be] == de: return "回头生"
    if KE[be] == de: return "回头克"
    if SHENG[de] == be: return "化泄气"
    if KE[de] == be: return "化克出"
    return ""
def line_power(z, month, day_zhi):
    ws = wangshuai(ZHI_WX[z], month); p = WS_SCORE[ws]
    if z == day_zhi: p += 2
    dr = rel_to(z, day_zhi)
    if "受生" in dr: p += 1
    if "受克" in dr: p -= 1
    if z == month: p += 2
    if _pair(z, month, CHONG): p -= 2
    return ws, p
def palace_head(palace):
    tri, pe = TRIGRAMS[palace]; zs = line_zhis(tri + tri)
    return [{"位": i+1, "地支": zs[i], "五行": ZHI_WX[zs[i]], "六亲": liuqin(pe, ZHI_WX[zs[i]])} for i in range(6)]
def find_fushen(palace, missing, ben_yao, month, day_zhi):
    cands = [h for h in palace_head(palace) if h["六亲"] == missing]
    if not cands: return None
    fu = max(cands, key=lambda h: line_power(h["地支"], month, day_zhi)[1])
    pos = fu["位"]; fu_z = fu["地支"]; fe_z = ben_yao[pos-1]["干支"][-1]
    fu_e = ZHI_WX[fu_z]; fe_e = ZHI_WX[fe_z]
    if SHENG[fe_e] == fu_e: rel, good = "飞来生伏(易出)", True
    elif KE[fu_e] == fe_e: rel, good = "伏克飞(得出)", True
    elif KE[fe_e] == fu_e: rel, good = "飞来克伏(受制难出)", False
    elif SHENG[fu_e] == fe_e: rel, good = "伏生飞(泄气难出)", False
    else: rel, good = "伏并飞(比和)", True
    ws, p = line_power(fu_z, month, day_zhi)
    return {"爻位": pos, "伏神": fu_z, "伏神五行": fu_e, "伏神六亲": missing, "飞神": fe_z,
            "飞神五行": fe_e, "飞伏关系": rel, "伏神旺衰": ws, "可出伏": bool(good and p >= 0)}
def duan(assembled, category, month, day_zhi):
    yao = assembled["本卦"]["六爻"]; ysrel = CATEGORY_YONGSHEN.get(category)
    if ysrel == "世":
        cands = [y for y in yao if y["世应"] == "世"]; ysrel = "自身/世爻"
    else:
        cands = [y for y in yao if y["六亲"] == ysrel]
    result = {"所测事": category, "用神六亲": ysrel, "用神两现": len(cands) > 1, "用神不上卦": False}
    v = []
    if not cands:
        result["用神不上卦"] = True
        fs = find_fushen(assembled["本卦"]["卦宫"], ysrel, yao, month, day_zhi); result["伏神"] = fs
        if fs and fs["可出伏"]:
            v.append({"点":"用神伏藏但可出("+fs["飞伏关系"]+"),事暂隐、遇时可现","吉凶":"待","依据":"伏于"+str(fs["爻位"])+"爻，"+fs["飞伏关系"],"置信":0.5})
        elif fs:
            v.append({"点":"用神伏藏且难出("+fs["飞伏关系"]+"),一时难成、或非其时","吉凶":"凶","依据":"伏神无力:"+fs["飞伏关系"]+"，"+fs["伏神旺衰"],"置信":0.55})
        else:
            v.append({"点":"用神与伏神俱不见,难以论断","吉凶":"待","依据":"卦中无"+str(ysrel),"置信":0.4})
        result["断语要点"] = v; return result
    def score(y):
        z = y["干支"][-1]; s = WS_SCORE[wangshuai(ZHI_WX[z], month)]
        if y["世应"] == "世": s += 3
        if y["动"]: s += 2
        if z == day_zhi: s += 2
        if z == month: s += 2
        if y["空"]: s -= 2
        return s
    p = max(cands, key=score); z = p["干支"][-1]; le = ZHI_WX[z]; ws = wangshuai(le, month)
    drel = rel_to(z, day_zhi); mrel = rel_to(z, month)
    result["用神"] = {"爻位": p["位"], "干支": p["干支"], "五行": le, "旺衰": ws, "临世": p["世应"] == "世",
                      "发动": p["动"], "旬空": p["空"], "日辰关系": drel, "月建关系": mrel}
    if ws in ("旺","相"):
        v.append({"点":"用神得时有气","吉凶":"吉","依据":"用神"+le+"于"+month+"月为"+ws,"置信":0.7})
    else:
        v.append({"点":"用神失时乏力","吉凶":"凶","依据":"用神"+le+"于"+month+"月为"+ws,"置信":0.6})
    if p["世应"] == "世":
        v.append({"点":"用神持世,所求在于自身、主动可得","吉凶":"吉","依据":"用神临世爻","置信":0.6})
    if ("受生" in mrel) or ("临" in mrel) or ("合" in mrel):
        v.append({"点":"月建生扶/合用神,得令中之助","吉凶":"吉","依据":"月建"+month+"与用神:"+"、".join(mrel),"置信":0.62})
    if ("受生" in drel) or ("临" in drel):
        v.append({"点":"得日辰生扶,根气尚足","吉凶":"吉","依据":"日辰"+day_zhi+"与用神:"+"、".join(drel),"置信":0.6})
    if "受克" in drel:
        v.append({"点":"日辰克制用神,阻力自当下起","吉凶":"凶","依据":"日辰"+day_zhi+"克用神","置信":0.6})
    if "冲" in mrel:
        v.append({"点":"月破,力弱难成、需待时","吉凶":"凶","依据":"月建"+month+"冲用神(月破)","置信":0.6})
    if p["空"]:
        v.append({"点":"用神旬空,事多悬而未决,宜待出空之时","吉凶":"待","依据":"用神临旬空","置信":0.55})
    if day_zhi == MU[le]:
        v.append({"点":"用神入日墓,气被收藏、事情胶着","吉凶":"凶","依据":"日辰"+day_zhi+"为用神"+le+"之墓库","置信":0.55})
    result["断语要点"] = v; return result
def shengke(assembled, movers, YE, primary_idx, month, day_zhi):
    v = []
    if not movers:
        v.append({"点":"六爻安静无动,吉凶主要凭用神旺衰与日月","吉凶":"待","依据":"卦中无动爻","置信":0.5}); return v
    yao = assembled["本卦"]["六爻"]; bianmap = assembled["变卦"]["动爻变"] if assembled["变卦"] else {}
    for i in movers:
        d = yao[i]["干支"][-1]; ws, pw = line_power(d, month, day_zhi)
        bz = bianmap.get(i+1, d)[-1]; ht = hui_tou(d, bz); strong = pw >= 1; pos = i+1
        if i == primary_idx:
            if ht in ("化进神","回头生"):
                v.append({"点":"用神自发动化进/回头生,事有主动推进、后力续增","吉凶":"吉","依据":str(pos)+"爻用神发动，"+ht,"置信":0.72})
            elif ht in ("化退神","回头克","化克出"):
                v.append({"点":"用神发动却"+ht+",起意又缩、亲力反受牵累","吉凶":"凶","依据":str(pos)+"爻用神发动，"+ht,"置信":0.66})
            else:
                v.append({"点":"用神自发动,有变动求成之象","吉凶":"吉","依据":str(pos)+"爻用神发动，"+(ht or "化比和"),"置信":0.55})
            continue
        role = role_vs(ZHI_WX[d], YE)
        if role == "原神":
            if strong and ht not in ("回头克","化退神","化克出"):
                v.append({"点":"原神发动来生用神,有助力/贵人相扶","吉凶":"吉","依据":str(pos)+"爻原神("+d+")发动生用神"+("，"+ht if ht else ""),"置信":0.7})
            else:
                v.append({"点":"原神虽动但力弱或自顾不暇,助力有限","吉凶":"吉","依据":str(pos)+"爻原神发动但"+(ht or "无力"),"置信":0.5})
        elif role == "忌神":
            if strong and ht not in ("回头克","化退神","化克出"):
                v.append({"点":"忌神发动克伤用神,主要阻力所在","吉凶":"凶","依据":str(pos)+"爻忌神("+d+")旺动克用神"+("，"+ht if ht else ""),"置信":0.75})
            else:
                v.append({"点":"忌神虽动但自身受制("+(ht or "无力")+"),凶中有解","吉凶":"凶","依据":str(pos)+"爻忌神发动但受制","置信":0.55})
        elif role == "泄神":
            v.append({"点":"用神之气被泄,心力分散、事易半途","吉凶":"凶","依据":str(pos)+"爻("+d+")发动泄用神之气","置信":0.5})
        elif role == "同类":
            v.append({"点":"同类(比劫)发动,主竞争分夺","吉凶":"待","依据":str(pos)+"爻同类("+d+")发动","置信":0.5})
        elif role == "受制":
            v.append({"点":"用神克向发动之爻,略耗其力","吉凶":"待","依据":str(pos)+"爻("+d+")被用神克","置信":0.45})
    return v
def yingqi(primary, YE, month, day_zhi):
    z = primary["干支"][-1]; c = []
    if day_zhi == MU[YE]:
        c.append({"类型":"冲墓","地支":chong_of(MU[YE]),"依据":"用神入日墓,冲墓之期方开","置信":0.5})
    if primary.get("旬空"):
        c.append({"类型":"出空·填实","地支":z,"依据":"用神旬空,值其支之期出空而应","置信":0.55})
        c.append({"类型":"出空·冲空","地支":chong_of(z),"依据":"冲空则实","置信":0.5})
    elif primary.get("发动"):
        c.append({"类型":"动逢合","地支":he_of(z),"依据":"用神发动,逢合之期成","置信":0.5})
        c.append({"类型":"值日","地支":z,"依据":"用神值其支之期应","置信":0.45})
    else:
        c.append({"类型":"静逢冲(引动)","地支":chong_of(z),"依据":"用神安静,逢冲引动而应","置信":0.5})
        c.append({"类型":"值日","地支":z,"依据":"用神值其支之期应","置信":0.45})
    return {"candidates": c, "caveat": "应期为启发式推断,置信偏低;日月合冲、旺衰会改动,仅参考不承诺"}
def yingqi_fu(fs):
    return {"candidates": [
        {"类型":"出伏·值伏神","地支":fs["伏神"],"依据":"值伏神地支,伏神透出而应","置信":0.45},
        {"类型":"出伏·冲飞神","地支":chong_of(fs["飞神"]),"依据":"冲去飞神,伏神得出","置信":0.45}],
        "caveat": "伏神应期尤其不稳,仅参考"}
def full_reading(lines_raw, category, month, day):
    """完整断卦 — 返回 §3.2.1 契约:卦象事实 + 用神分析 + 断语要点 + 整体倾向 + 不确定度 + 应期."""
    dg, dz = day; a = assemble(lines_raw, day=(dg, dz)); d = duan(a, category, month, dz)
    fr = {"卦象事实": a, "元数据": {"所测事": category, "method": "manual_shake", "月建": month, "日辰": dg+dz}}
    verdicts = list(d.get("断语要点", [])); movers = [i for i in range(6) if lines_raw[i] in (6, 9)]
    if "用神" in d:
        YE = d["用神"]["五行"]; ppos = d["用神"]["爻位"]; pline = a["本卦"]["六爻"][ppos-1]
        verdicts += shengke(a, movers, YE, ppos-1, month, dz)
        ua = dict(d["用神"]); ua["原神"] = origin_of(YE); ua["忌神"] = ji_of(YE); ua["用神两现"] = d["用神两现"]
        fr["用神分析"] = ua; fr["应期"] = yingqi(pline, YE, month, dz)
    else:
        fs = d.get("伏神"); fr["用神分析"] = {"不上卦": True, "用神六亲": d["用神六亲"], "伏神": fs}
        fr["应期"] = yingqi_fu(fs) if fs else {"candidates": [], "caveat": "用神与伏神俱无,难以定期"}
    score = sum(x["置信"] * (1 if x["吉凶"] == "吉" else (-1 if x["吉凶"] == "凶" else 0)) for x in verdicts)
    fr["整体倾向"] = "偏吉" if score > 0.3 else ("偏凶" if score < -0.3 else "吉凶参半/需观察")
    fr["倾向分值"] = round(score, 2); fr["不确定度"] = "高" if (d.get("用神不上卦") or abs(score) < 0.3) else "中"
    fr["断语要点"] = verdicts; return fr
