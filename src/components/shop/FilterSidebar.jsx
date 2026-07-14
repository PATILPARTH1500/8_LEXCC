import React from 'react';
import styles from '../../pages/Public/Shop.module.css';

const FilterSidebar = () => {
  return (
    <aside className={styles.filterSidebar}>
      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Category</h4>
        <ul className={styles.filterList}>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Outerwear</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Tops</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Bottoms</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Footwear</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Accessories</label></li>
        </ul>
      </div>

      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Size</h4>
        <ul className={styles.filterList}>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> XS</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> S</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> M</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> L</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> XL</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> XXL</label></li>
        </ul>
      </div>

      <div className={styles.filterSection}>
        <h4 className={styles.filterTitle}>Color</h4>
        <ul className={styles.filterList}>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Black</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> White</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Earth</label></li>
        </ul>
      </div>

      <div className={styles.filterSection} style={{ borderBottom: 'none' }}>
        <h4 className={styles.filterTitle}>Availability</h4>
        <ul className={styles.filterList}>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> In Stock</label></li>
          <li className={styles.filterItem}><label className={styles.filterLabel}><input type="checkbox" /> Pre-Order</label></li>
        </ul>
      </div>
    </aside>
  );
};

export default FilterSidebar;
