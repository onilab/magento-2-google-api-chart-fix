<?php
/**
 * Onilab GoogleChartFix
 *
 * @category   Onilab
 * @package    Onilab_GoogleChartFix
 * @version    1.0.0
 *
 * Release with version 1.0.0
 *
 * @author     Onilab https://onilab.com/
 * @copyright  Copyright (c) 2019 Onilab LLC
 */

namespace Onilab\GoogleChartFix\Block\Dashboard\Tab;

class Orders extends \Magento\Backend\Block\Dashboard\Tab\Orders
{
    /**
     * Initialize object
     *
     * @return void
     */
    protected function _construct()
    {
        $this->setTemplate('Onilab_GoogleChartFix::dashboard/graph.phtml');
        parent::_construct();
    }

    public function getChartData()
    {
        $chartData = [
            'period' => $this->getDataHelper()->getParam('period'),
            'rows' => [],
            'y' => []
        ];

        $this->_allSeries = $this->getRowsData($this->_dataRows);

        foreach ($this->_axisMaps as $axis => $attr) {
            $this->setAxisLabels($axis, $this->getRowsData($attr, true));
        }

        $timezoneLocal = $this->_localeDate->getConfigTimezone();

        /** @var \DateTime $dateStart */
        /** @var \DateTime $dateEnd */
        list($dateStart, $dateEnd) = $this->_collectionFactory->create()->getDateRange(
            $this->getDataHelper()->getParam('period'),
            '',
            '',
            true
        );

        $dateStart->setTimezone(new \DateTimeZone($timezoneLocal));
        $dateEnd->setTimezone(new \DateTimeZone($timezoneLocal));

        if ($this->getDataHelper()->getParam('period') == '24h') {
            $dateEnd->modify('-1 hour');
        } else {
            $dateEnd->setTime(23, 59, 59);
            $dateStart->setTime(0, 0, 0);
        }

        $dates = [];
        $datas = [];

        while ($dateStart <= $dateEnd) {
            $dates[] = $dateStart->format('Y/m/d H:00:00');

            switch ($this->getDataHelper()->getParam('period')) {
                case '7d':
                case '1m':
                    $d = $dateStart->format('Y-m-d');
                    $dateStart->modify('+1 day');
                    break;
                case '1y':
                case '2y':
                    $d = $dateStart->format('Y-m');
                    $dateStart->modify('+1 month');
                    break;
                default:
                    $d = $dateStart->format('Y-m-d H:00');
                    $dateStart->modify('+1 hour');
            }
            foreach ($this->getAllSeries() as $index => $serie) {
                if (in_array($d, $this->_axisLabels['x'])) {
                    $datas[$index][] = (double)array_shift($this->_allSeries[$index]);
                } else {
                    $datas[$index][] = 0;
                }
            }
        }

        foreach($dates as $date){
            $chartData['rows'][] = [$date];
        }

        foreach($datas as $index => $series){
            foreach($series as $i => $value) {
                $chartData['rows'][$i][] = $value;
            }
        }
        $this->_allSeries = $datas;

        // process each string in the array, and find the max length
        $localmaxvalue = [0];
        $localminvalue = [0];
        foreach ($this->getAllSeries() as $index => $serie) {
            $localmaxvalue[$index] = max($serie);
            $localminvalue[$index] = min($serie);
        }

        $maxvalue = max($localmaxvalue);
        $minvalue = min($localminvalue);

        // default values
        $yLabels = [];
        $miny = 0;

        if ($minvalue >= 0 && $maxvalue >= 0) {
            if ($maxvalue > 10) {
                $p = pow(10, $this->_getPow($maxvalue));
                $maxy = ceil($maxvalue / $p) * $p;
                $yLabels = range($miny, $maxy, $p);
            } else {
                $maxy = ceil($maxvalue + 1);
                $yLabels = range($miny, $maxy, 1);
            }
        }

        $chartData['y']['max'] = $maxy;
        $chartData['y']['ticks'] = $yLabels;

        return $chartData;
    }

    public function getTitle()
    {
        return __('Orders');
    }
}
