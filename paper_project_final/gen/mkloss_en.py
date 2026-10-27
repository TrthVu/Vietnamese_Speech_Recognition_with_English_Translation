import json, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9.5,'axes.edgecolor':'#52514e','axes.labelcolor':'#0b0b0b','text.color':'#0b0b0b','xtick.color':'#52514e','ytick.color':'#52514e','axes.spines.top':False,'axes.spines.right':False,'axes.grid':True,'grid.color':'#e6e5e1','grid.linewidth':.6,'axes.axisbelow':True})
BLUE,ORANGE='#2a78d6','#eb6834'
runs=[('B_100','B_100 (49,500 samples, ASR source)'),('clean_100','clean_100 (49,500 samples, clean source)'),('B_50','B_50 (24,750 samples, ASR source)'),('B_25','B_25 (12,375 samples, ASR source)')]
fig,axs=plt.subplots(2,2,figsize=(8.4,5.6),sharey=True)
for ax,(k,title) in zip(axs.flat,runs):
    h=json.load(open(f'logs/{k}.json'))
    tr=[(x['epoch'],x['loss']) for x in h if 'loss' in x and 'eval_loss' not in x]
    ev=[(x['epoch'],x['eval_loss']) for x in h if 'eval_loss' in x]
    ax.plot(*zip(*tr),'o-',color=BLUE,lw=2,ms=4); ax.plot(*zip(*ev),'o-',color=ORANGE,lw=2,ms=4)
    be=min(ev,key=lambda p:p[1]); ax.axvline(be[0],color='#52514e',ls=':',lw=1)
    ax.plot([be[0]],[be[1]],'o',ms=9,mfc='none',mec='#0b0b0b',mew=1.2)
    ax.text(be[0]+.2,be[1]+.2,f'best: epoch {int(be[0])}\ndev loss {be[1]:.3f}',fontsize=8,va='bottom')
    ax.text(tr[-1][0]+.15,tr[-1][1],'train',color='#0b0b0b',fontsize=8,va='center'); ax.text(ev[-1][0]+.15,ev[-1][1],'dev',fontsize=8,va='center')
    ax.set_title(title,fontsize=9.5); ax.set_xlim(.5,12.4); ax.set_ylim(.5,2.1)
for ax in axs[1]: ax.set_xlabel('epoch')
for ax in axs[:,0]: ax.set_ylabel('loss')
plt.tight_layout(); plt.savefig('../figs/fig_loss.png',dpi=200); print('ok')
